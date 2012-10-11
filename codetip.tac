from twisted.application import strports
from twisted.application.service import Application
from twisted.web.server import Site

from axiom.store import Store

from codetip.resource import RootResource



application = Application('codetip')

store = Store('codetip.axiom')

service = strports.service(
    'tcp:8080:',
    Site(RootResource(store)))
service.setServiceParent(application)
