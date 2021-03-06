
npm-jest:
	/bin/bash docker.sh --tty -i --mode dev -- /bin/bash docker.sh dev-install

jest:
	@echo "\nrun:\n    /bin/bash test.sh --help\n"

wprod: yarndev
	/bin/bash webpack.sh

wdev:
	/bin/bash webpack.sh dev

preprocess:
	(cd app && node lib/preprocessor.js)

# prod or dev
server:
	node server.js

dev: recreate mrun
	/bin/bash server.sh

esdeleteindex:
	@echo "\n\n    node server.js --delete\n\n"

yarnprod:
	export NODE_ENV=production && yarn

yarndev:
	yarn





doc: docs
	(cd docker && /bin/bash docker-compose.sh up)
	(cd migrations && node recreate-db.js safe)
	make -s mrun

docs:
	(cd docker && /bin/bash docker-compose.sh stop)



fixtures: rebuild
	@(cd migrations && node recreate-db.js safe)
	@(cd migrations && make -s mrun)

diff:
	@(cd migrations && make -s diff)

mrun:
	@(cd migrations && make -s nitrorun)

mmove:
	@(cd migrations && make -s nitromove)

torun:
	@(cd migrations && make -s torun)

mrevert:
	@(cd migrations && make -s nitrorevert)

mtest:
	@(cd migrations && make -s mtest)

minfo:
	@(cd migrations && make -s minfo)

mcountdb:
	@(cd migrations && make -s mcountdb)

recreate:
	@(cd migrations && make -s recreate)
