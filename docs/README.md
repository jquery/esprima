
Unix:
```bash
virtualenv env
source env/bin/activate
pip install -r requirements.txt
cd docs
make html
```

Windows:
```bash
virtualenv env
env\Script\activate
pip install -r requirements.txt
cd docs
make html
```

Open the file `_build/html/index.html` in a web browser.
