class Paste extends Backbone.Model
    urlRoot: '/api/pastes'


    ###
    URL path name for this paste.
    ###
    pathName: =>
        name = @get 'name'
        ext = window.app.languages[@get 'languageHint']
        if ext? then "#{ name }.#{ ext }"
        else "#{ name }"



class PasteControls extends Backbone.View
    template: _.template $('#paste-controls-template').html()


    render: ->
        @$el.html @template()
        @attachActions()
        return @


    ###
    Bind keyboard shortcuts and attach DOM event handlers.
    ###
    attachActions: () =>
        Mousetrap.reset()
        @bindings = {}
        @events = {}
        @$('button').each (i, el) =>
            el = $(el)
            className = el.prop 'className'
            shortcut = el.data 'shortcut'
            funcName = className.substring 3
            @events["click .#{ className }"] = funcName
            @bindings[funcName] = shortcut
            title = el.prop 'title'
            el.prop 'title', "#{ title } [#{ shortcut }]"
            Mousetrap.bind shortcut, (event) =>
                event= $.event.fix event
                event.preventDefault()
                @[funcName](event)
        @delegateEvents()


    ###
    Disable actions by name.
    ###
    disableActions: (names) ->
        for name in names
            @$(".js-#{ name }").prop('disabled', true)
            Mousetrap.unbind @bindings[name]


    ###
    Navigate to the new paste view.
    ###
    newPaste: =>
        window.router.navigate '',
            trigger: true


    ###
    Save the currently entered text and redirect to the view for it.
    ###
    savePaste: =>
        data = @$el.parent().find('textarea').val()
        highlight = hljs.highlightAuto data
        paste = new Paste
            languageHint: highlight.language
            content: data
        d = paste.save()
        d.done () ->
            window.router.navigate paste.pathName(),
                trigger: true


    rawPaste: =>
        window.location = "/raw/#{ @model.id }"




class NewPasteView extends Backbone.View
    template: _.template $('#new-paste-template').html()


    render: ->
        window.app.setWindowTitle()
        @$el.html @template()
        controls = new PasteControls
            model: @model
        @$el.append controls.render().el
        # Set up a custom "inserted" event that is triggered when the view is
        # inserted into the DOM, then focus the <textarea>.
        @$el.on 'inserted', =>
            @$('textarea').focus()
        return @



class PasteView extends Backbone.View
    template: _.template $('#paste-template').html()


    ###
    Perform syntax highlighting on the paste content.
    ###
    highlightContent: (content, lang) =>
        if lang?
            highlight = hljs.highlight lang, content
        else if lang == null
            highlight =
                value: window.app.escapeHTML content
        else
            highlight = hljs.highlightAuto content
        return highlight


    ###
    Add line numbers to content.
    ###
    lineNumbers: (content) ->
        lines = content.split '\n'
        result = $('<div>')
        for line in lines
            #if not line.length
            #    line = '&nbsp;'
            result.append(
                $('<span>').html(line + '\n').addClass('line'))
        return result.html()


    render: ->
        window.app.setWindowTitle @model.get 'name'
        data = @model.toJSON()
        highlight = @highlightContent data.content, @model.get 'languageHint'
        data.highlightedContent = @lineNumbers highlight.value
        @$el.html @template data

        controls = new PasteControls
            model: @model
        @$el.append controls.render().el
        controls.disableActions ['savePaste']
        return @



class App
    @_EXTENSIONS:
        bash: 'bash'
        cc: 'cpp'
        coffee: 'coffeescript'
        cpp: 'cpp'
        cs: 'cs'
        css: 'css'
        diff: 'diff'
        erl: 'erlang'
        go: 'go'
        hs: 'haskell'
        htm: 'xml'
        html: 'xml'
        ini: 'ini'
        java: 'java'
        js: 'javascript'
        lisp: 'lisp'
        lua: 'lua'
        m: 'objectivec'
        md: 'markdown'
        pas: 'delphi'
        php: 'php'
        pl: 'perl'
        py: 'python'
        rb: 'ruby'
        scala: 'scala'
        sh: 'bash'
        sm: 'smalltalk'
        sql: 'sql'
        tex: 'tex'
        txt: null
        vala: 'vala'
        vbs: 'vbscript'
        xml: 'xml'


    extensions: App._EXTENSIONS

    languages: _.invert App._EXTENSIONS

    _HTMLreplacements:
        '&': '&amp;'
        '"': '&quot'
        '<': '&lt;'
        '>': '&gt;'


    ###
    Escape an HTML string.
    ###
    escapeHTML: (str) ->
        return str.replace /[&"<>]/g, (m) =>
            @_HTMLreplacements[m]


    ###
    Set the window title.
    ###
    setWindowTitle: (text) ->
        title = 'codetip'
        if text?
            title = "#{ title } — #{ text }"
        document.title = title



class AppView extends Backbone.View
    el: $('#app')


    ###
    Replace the current view with a new view.

    This will remove the old view from the DOM and trigger the "inserted" custom
    event on the new view.
    ###
    replaceView: (view) ->
        view.render()
        if @currentView
            @currentView.remove()
        @currentView = view
        @$el.empty()
        @$el.append view.el
        view.$el.trigger 'inserted'



class CodetipRouter extends Backbone.Router
    routes:
        '': 'create'
        ':id': 'view'


    create: ->
        view = new NewPasteView
        @appView.replaceView view


    view: (id) ->
        [id, ext] = id.split '.', 2
        paste = new Paste
            id: id
        d = paste.fetch()
        d.fail () =>
            # Navigate to the root, to create a new paste, if fetching the
            # paste failed; probably because the paste name is invalid.
            @navigate '',
                trigger: true
        d.done () =>
            lang = window.app.extensions[ext]
            paste.set 'languageHint', lang
            view = new PasteView
                model: paste
            @appView.replaceView view



$(document).ready ->
    window.app = new App
    window.router = new CodetipRouter
    router.appView = new AppView
    Backbone.history.start pushState: true
