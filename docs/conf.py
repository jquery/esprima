import sys
import os

project = u'Esprima'
author = u'Ariya Hidayat'
version = 'master'
release = 'master'

master_doc = 'index'
exclude_patterns = ['_build']
pygments_style = 'sphinx'

# HTML output
html_theme = "alabaster"
html_theme_options = {
        'fixed_sidebar': False,
        'logo_name': True,
        'description': 'ECMAScript parsing infrastructure for multipurpose analysis',
        'logo': 'esprima.png',
        'github_user': 'jquery',
        'github_repo': 'esprima',
        'github_type': 'star',
        'font_family': '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
        'head_font_family': '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
        'code_font_family': '"Roboto Mono",Menlo,Monaco,Consolas,"Courier New",monospace',
}
html_sidebars = {
    '**': [
        'about.html',
        'searchbox.html',
        'navigation.html',
    ]
}
html_static_path = ['_static']
html_show_sourcelink = False
html_show_sphinx = True
html_show_copyright = False
htmlhelp_basename = 'Testdoc'

# Markdown support
from recommonmark.parser import CommonMarkParser
source_suffix = ['.rst', '.md']
source_parsers = {
	'.md': CommonMarkParser,
}

