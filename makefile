include ./.env

build:
	web-ext build -s ext

run:
	web-ext run --bc -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE}

sign:
	web-ext sign -s ext --api-key ${APIKEY} --api-secret ${APISECRET}

icon.png:
	convert icon.psd[0] ext/icon.png

remove_artifacts:
	rm ./web-ext-artifacts/*