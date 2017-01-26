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
import sphinx_rtd_theme
html_theme = "sphinx_rtd_theme"
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]
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

