include ./.env

ignore_files = ".git" ".gitignore" "makefile" ".env" "web-ext-artifacts" "icon.psd" "README.MD"

build:
	web-ext build --ignore-files ${ignore_files}

run:
	web-ext run --bc

sign:
	web-ext sign --api-key ${APIKEY} --api-secret ${APISECRET} --ignore-files ${ignore_files}

icon.png:
	convert icon.psd[0] icon.png