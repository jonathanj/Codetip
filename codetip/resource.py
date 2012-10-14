import json
import itertools

from axiom.store import Store
from axiom.errors import ItemNotFound

from twisted.web.resource import Resource, NoResource
from twisted.web.static import File, Data
from twisted.python.filepath import FilePath

from codetip.paste import Paste
from codetip.markov import japaneseChain



staticDir = FilePath(__file__).sibling('static')



class RootResource(Resource):
    """
    Root Codetip resource.
    """
    def __init__(self, store=None):
        if store is None:
            store = Store('codetip.axiom')
        self.store = store
        Resource.__init__(self)
        self.putChild('static', File(staticDir.path, defaultType='text/plain'))
        self.putChild('', MainResource(store))
        self.putChild('api', APIResource(store))


    def getChild(self, path, request):
        return MainResource(self.store)



class MainResource(Resource):
    """
    Main Codetip resource.

    This resource just serves up the I{main.html} template, and lets everything
    happen from the client side.
    """
    isLeaf = True


    def __init__(self, store):
        self.store = store
        Resource.__init__(self)


    def render_GET(self, request):
        data = staticDir.child('templates').child('main.html').getContent()
        return Data(data, 'text/html; charset=UTF-8').render_GET(request)



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
        self.store = store
        self.chain = japaneseChain()
        Resource.__init__(self)


    def generateName(self, n=8):
        """
        Generate a paste name.

        @type  n: L{int}
        @param n: Length of the name to generate.

        @rtype: L{unicode}
        """
        return u''.join(itertools.islice(self.chain, n))


    def render_POST(self, request):
        data = json.load(request.content)
        p = Paste(
            store=self.store,
            name=self.generateName(),
            **data)
        return p.toJSON()


    def getChild(self, path, request):
        try:
            paste = Paste.findByName(self.store, path.decode('ascii'))
        except ItemNotFound:
            return NoResource('No such paste')
        else:
            return Data(paste.toJSON(), 'application/json')
