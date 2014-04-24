import json

from epsilon.extime import Time

from axiom.attributes import text, timestamp
from axiom.item import Item



def jsonSerialize(obj):
    """
    Serialize complex JSON objects.
    """
    if isinstance(obj, Time):
        return obj.asPOSIXTimestamp()
    raise TypeError(obj)



class Paste(Item):
    """
    Paste item.
    """
    created = timestamp(
        defaultFactory=lambda: Time(), doc=u'Creation timestamp')
    languageHint = text(doc=u'Paste content language hint')
    name = text(allowNone=False, indexed=True, doc=u'Paste name')
    content = text(allowNone=False, doc=u'Paste content')


    def run(self):
        self.deleteFromStore()


    def toJSON(self):
        """
        Describe the L{Paste} item as I{JSON}.
        """
        attrs = dict(self.persistentValues())
        attrs['id'] = attrs['name']
        return json.dumps(attrs, default=jsonSerialize)


    @classmethod
    def findByName(cls, store, name):
        """
        Get a L{Paste} item by name.
        """
        return store.findUnique(Paste, Paste.name == name)
