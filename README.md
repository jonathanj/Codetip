# Codetip – A Twisted Web and Backbone pastebin

Codetip is a [hastebin](http://hastebin.com) clone written in Twisted Web with Backbone and client-side templates.

## Installing

    # Clone Codetip repo.
    $ git clone http://github.com/jonathanj/Codetip

    # Install Python dependencies.
    $ pip install Twisted Epsilon Axiom

    # Install Brewer.js.
    $ npm install brewer

    # Install dependencies for sucessfully building the Brewfile.
    $ brake install

    # Build assets.
    $ brake all

    # Start a Codetip instance with Google Analytics tracking.
    $ twistd -n codetip --notracebacks --dbdir=codetip.axiom --tracking-id='YOUR-TRACKING-ID'
