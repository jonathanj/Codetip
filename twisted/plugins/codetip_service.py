from twisted.internet import reactor

from zope.interface import implements

from twisted.application import strports
from twisted.application.service import IService, IServiceMaker
from twisted.plugin import IPlugin
from twisted.python import usage
from twisted.web.server import Site

from axiom.store import Store

from codetip.resource import RootResource



class Options(usage.Options):
    optFlags = [
        ['notracebacks', None, 'Codetip database directory']]

    optParameters = [
        ['tracking-id', None, None, 'Google Analytics tracking ID'],
        ['dbdir', 'd', 'codetip.axiom', 'Codetip database directory'],
        ['port', 'p', 'tcp:8080', 'Service strport description']]



class CodetipServiceMaker(object):
    implements(IServiceMaker, IPlugin)
    tapname = 'codetip'
    description = 'Pastebin'
    options = Options


    def makeService(self, options):
        store = Store(options['dbdir'])
        siteService = IService(store)

        site = Site(
            RootResource(store=store,
                         trackingID=options['tracking-id']))
        site.displayTracebacks = not options['notracebacks']
        siteService.addService(
            strports.service(options['port'], site, reactor=reactor))
        return siteService

serviceMaker = CodetipServiceMaker()
