import json
import itertools
from datetime import timedelta

from epsilon.extime import Time

from axiom.iaxiom import IScheduler
from axiom.store import Store
from axiom.errors import ItemNotFound

from twisted.web.resource import Resource, NoResource
from twisted.web.static import File, Data
from twisted.web.template import Element, renderer, XMLFile, flattenString
from twisted.web.util import DeferredResource
from twisted.python.filepath import FilePath

from codetip.paste import Paste
from codetip.markov import japaneseChain



staticDir = FilePath(__file__).parent().sibling('static')



class RootResource(Resource):
    """
    Root Codetip resource.
    """
    def __init__(self, store=None, trackingID=None):
        if store is None:
            store = Store('codetip.axiom')
        self.store = store
        self.trackingID = trackingID
        Resource.__init__(self)
        self.putChild('static', File(staticDir.path, defaultType='text/plain'))
        self.putChild('', MainResource(store=store, trackingID=self.trackingID))
        self.putChild('api', APIResource(store))
        self.putChild('raw', RawResource(store))


    def getChild(self, path, request):
        return MainResource(store=self.store, trackingID=self.trackingID)



class MainElement(Element):
    """
    Main Codetip view.

    This element renders I{main.html} template, and lets everything happen from
    the client side.
    """
    loader = XMLFile(staticDir.child('templates').child('main.html'))


    def __init__(self, trackingID):
        self.trackingID = trackingID
        super(MainElement, self).__init__()


    @renderer
    def googleAnalytics(self, req, tag):
        if self.trackingID is None:
            return []
        return tag.fillSlots(trackingID=self.trackingID)



class MainResource(Resource):
    """
    Main Codetip resource.
    """
    isLeaf = True


    def __init__(self, store, trackingID):
        self.store = store
        self.trackingID = trackingID
        Resource.__init__(self)


    def render_GET(self, request):
        d = flattenString(request, MainElement(self.trackingID))
        d.addCallback(Data, 'text/html')
        return DeferredResource(d).render(request)



class RawResource(Resource):
    """
    Raw paste content resource.
    """
    def __init__(self, store):
        self.store = store
        Resource.__init__(self)


    def getChild(self, path, request):
        try:
            paste = Paste.findByName(self.store, path.decode('ascii'))
        except ItemNotFound:
            return NoResource('No such paste')
        else:
            return Data(paste.content.encode('utf-8'), 'text/plain; charset=UTF-8')



class APIResource(Resource):
    """
    API parent resource.
    """
    def __init__(self, store):
        Resource.__init__(self)
        self.putChild('pastes', PastesAPIResource(store))



class PastesAPIResource(Resource):
    """
    Resource for the "pastes" API.

    I{POST}ing to this resource will create a new L{Paste} item. I{GET}ting
    a child of this resource will look a L{Paste} item up by its I{name}
    attribute.
    """
    def __init__(self, store):
        self._store = store
        self._scheduler = IScheduler(self._store)
        self._chain = japaneseChain()
        Resource.__init__(self)


    def _generateName(self, n=8):
        """
        Generate a paste name.

        @type  n: L{int}
        @param n: Length of the name to generate.

        @rtype: L{unicode}
        """
        return u''.join(itertools.islice(self._chain, n))


    def _createPaste(self, content, languageHint=None):
        p = Paste(
            store=self._store,
            name=self._generateName(),
            content=content,
            languageHint=languageHint)
        # <k4y> so what's a good paste lifetime?
        # * mithrandi picks "6 days" out of a musical hat
        # <k4y> what's it playing?
        # <mithrandi> DJ Shadow - Six Days
        expiryDate = Time() + timedelta(days=6)
        self._scheduler.schedule(p, expiryDate)
        return p


    def render_POST(self, request):
        data = json.load(request.content)
        return self._createPaste(**data).toJSON()


    def getChild(self, path, request):
        try:
            paste = Paste.findByName(self._store, path.decode('ascii'))
        except ItemNotFound:
            return NoResource('No such paste')
        else:
            return Data(paste.toJSON(), 'application/json')
