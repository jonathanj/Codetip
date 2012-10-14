(function() {
  var App, AppView, CodetipRouter, NewPasteView, Paste, PasteControls, PasteView;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Paste = (function() {

    __extends(Paste, Backbone.Model);

    function Paste() {
      this.pathName = __bind(this.pathName, this);
      Paste.__super__.constructor.apply(this, arguments);
    }

    Paste.prototype.urlRoot = '/api/pastes';

    /*
        URL path name for this paste.
    */

    Paste.prototype.pathName = function() {
      var ext, name;
      name = this.get('name');
      ext = window.app.languages[this.get('languageHint')];
      if (ext != null) {
        return "" + name + "." + ext;
      } else {
        return "" + name;
      }
    };

    return Paste;

  })();

  PasteControls = (function() {

    __extends(PasteControls, Backbone.View);

    function PasteControls() {
      this.rawPaste = __bind(this.rawPaste, this);
      this.savePaste = __bind(this.savePaste, this);
      this.newPaste = __bind(this.newPaste, this);
      this.attachActions = __bind(this.attachActions, this);
      PasteControls.__super__.constructor.apply(this, arguments);
    }

    PasteControls.prototype.template = _.template($('#paste-controls-template').html());

    PasteControls.prototype.render = function() {
      this.$el.html(this.template());
      this.attachActions();
      return this;
    };

    /*
        Bind keyboard shortcuts and attach DOM event handlers.
    */

    PasteControls.prototype.attachActions = function() {
      var _this = this;
      Mousetrap.reset();
      this.bindings = {};
      this.events = {};
      this.$('button').each(function(i, el) {
        var className, funcName, shortcut, title;
        el = $(el);
        className = el.prop('className');
        shortcut = el.data('shortcut');
        funcName = className.substring(3);
        _this.events["click ." + className] = funcName;
        _this.bindings[funcName] = shortcut;
        title = el.prop('title');
        el.prop('title', "" + title + " [" + shortcut + "]");
        return Mousetrap.bind(shortcut, function(event) {
          event = $.event.fix(event);
          event.preventDefault();
          return _this[funcName](event);
        });
      });
      return this.delegateEvents();
    };

    /*
        Disable actions by name.
    */

    PasteControls.prototype.disableActions = function(names) {
      var name, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        this.$(".js-" + name).prop('disabled', true);
        _results.push(Mousetrap.unbind(this.bindings[name]));
      }
      return _results;
    };

    /*
        Navigate to the new paste view.
    */

    PasteControls.prototype.newPaste = function() {
      return window.router.navigate('', {
        trigger: true
      });
    };

    /*
        Save the currently entered text and redirect to the view for it.
    */

    PasteControls.prototype.savePaste = function() {
      var d, data, highlight, paste;
      data = this.$el.parent().find('textarea').val();
      highlight = hljs.highlightAuto(data);
      paste = new Paste({
        languageHint: highlight.language,
        content: data
      });
      d = paste.save();
      return d.done(function() {
        return window.router.navigate(paste.pathName(), {
          trigger: true
        });
      });
    };

    PasteControls.prototype.rawPaste = function() {
      return window.location = "/raw/" + this.model.id;
    };

    return PasteControls;

  })();

  NewPasteView = (function() {

    __extends(NewPasteView, Backbone.View);

    function NewPasteView() {
      NewPasteView.__super__.constructor.apply(this, arguments);
    }

    NewPasteView.prototype.template = _.template($('#new-paste-template').html());

    NewPasteView.prototype.render = function() {
      var controls;
      var _this = this;
      window.app.setWindowTitle();
      this.$el.html(this.template());
      controls = new PasteControls({
        model: this.model
      });
      this.$el.append(controls.render().el);
      this.$el.on('inserted', function() {
        return _this.$('textarea').focus();
      });
      return this;
    };

    return NewPasteView;

  })();

  PasteView = (function() {

    __extends(PasteView, Backbone.View);

    function PasteView() {
      this.highlightContent = __bind(this.highlightContent, this);
      PasteView.__super__.constructor.apply(this, arguments);
    }

    PasteView.prototype.template = _.template($('#paste-template').html());

    /*
        Perform syntax highlighting on the paste content.
    */

    PasteView.prototype.highlightContent = function(content, lang) {
      var highlight;
      if (lang != null) {
        highlight = hljs.highlight(lang, content);
      } else if (lang === null) {
        highlight = {
          value: window.app.escapeHTML(content)
        };
      } else {
        highlight = hljs.highlightAuto(content);
      }
      return highlight;
    };

    /*
        Add line numbers to content.
    */

    PasteView.prototype.lineNumbers = function(content) {
      var line, lines, result, _i, _len;
      lines = content.split('\n');
      result = $('<div>');
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        line = lines[_i];
        result.append($('<span>').html(line + '\n').addClass('line'));
      }
      return result.html();
    };

    PasteView.prototype.render = function() {
      var controls, data, highlight;
      window.app.setWindowTitle(this.model.get('name'));
      data = this.model.toJSON();
      highlight = this.highlightContent(data.content, this.model.get('languageHint'));
      data.highlightedContent = this.lineNumbers(highlight.value);
      this.$el.html(this.template(data));
      controls = new PasteControls({
        model: this.model
      });
      this.$el.append(controls.render().el);
      controls.disableActions(['savePaste']);
      return this;
    };

    return PasteView;

  })();

  App = (function() {

    function App() {}

    App._EXTENSIONS = {
      bash: 'bash',
      cc: 'cpp',
      coffee: 'coffeescript',
      cpp: 'cpp',
      cs: 'cs',
      css: 'css',
      diff: 'diff',
      erl: 'erlang',
      go: 'go',
      hs: 'haskell',
      htm: 'xml',
      html: 'xml',
      ini: 'ini',
      java: 'java',
      js: 'javascript',
      lisp: 'lisp',
      lua: 'lua',
      m: 'objectivec',
      md: 'markdown',
      pas: 'delphi',
      php: 'php',
      pl: 'perl',
      py: 'python',
      rb: 'ruby',
      scala: 'scala',
      sh: 'bash',
      sm: 'smalltalk',
      sql: 'sql',
      tex: 'tex',
      txt: null,
      vala: 'vala',
      vbs: 'vbscript',
      xml: 'xml'
    };

    App.prototype.extensions = App._EXTENSIONS;

    App.prototype.languages = _.invert(App._EXTENSIONS);

    App.prototype._HTMLreplacements = {
      '&': '&amp;',
      '"': '&quot',
      '<': '&lt;',
      '>': '&gt;'
    };

    /*
        Escape an HTML string.
    */

    App.prototype.escapeHTML = function(str) {
      var _this = this;
      return str.replace(/[&"<>]/g, function(m) {
        return _this._HTMLreplacements[m];
      });
    };

    /*
        Set the window title.
    */

    App.prototype.setWindowTitle = function(text) {
      var title;
      title = 'codetip';
      if (text != null) title = "" + title + " — " + text;
      return document.title = title;
    };

    return App;

  })();

  AppView = (function() {

    __extends(AppView, Backbone.View);

    function AppView() {
      AppView.__super__.constructor.apply(this, arguments);
    }

    AppView.prototype.el = $('#app');

    /*
        Replace the current view with a new view.
    
        This will remove the old view from the DOM and trigger the "inserted" custom
        event on the new view.
    */

    AppView.prototype.replaceView = function(view) {
      view.render();
      if (this.currentView) this.currentView.remove();
      this.currentView = view;
      this.$el.empty();
      this.$el.append(view.el);
      return view.$el.trigger('inserted');
    };

    return AppView;

  })();

  CodetipRouter = (function() {

    __extends(CodetipRouter, Backbone.Router);

    function CodetipRouter() {
      CodetipRouter.__super__.constructor.apply(this, arguments);
    }

    CodetipRouter.prototype.routes = {
      '': 'create',
      ':id': 'view'
    };

    CodetipRouter.prototype.create = function() {
      var view;
      view = new NewPasteView;
      return this.appView.replaceView(view);
    };

    CodetipRouter.prototype.view = function(id) {
      var d, ext, paste, _ref;
      var _this = this;
      _ref = id.split('.', 2), id = _ref[0], ext = _ref[1];
      paste = new Paste({
        id: id
      });
      d = paste.fetch();
      d.fail(function() {
        return _this.navigate('', {
          trigger: true
        });
      });
      return d.done(function() {
        var lang, view;
        lang = window.app.extensions[ext];
        paste.set('languageHint', lang);
        view = new PasteView({
          model: paste
        });
        return _this.appView.replaceView(view);
      });
    };

    return CodetipRouter;

  })();

  $(document).ready(function() {
    window.app = new App;
    window.router = new CodetipRouter;
    router.appView = new AppView;
    return Backbone.history.start({
      pushState: true
    });
  });

}).call(this);
