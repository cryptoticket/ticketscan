NODE_MODULES = $(CURDIR)/node_modules
PROJECT = scanner

all: $(NODE_MODULES)

$(NODE_MODULES): $(CURDIR)/package.json
	yarn install
	@touch $(NODE_MODULES)

docker:
	docker build -t $(PROJECT):latest -f$(CURDIR)/devops/Dockerfile $(CURDIR)

docker-shell: docker
	docker run -it --rm --entrypoint=/bin/bash -v $(CURDIR)/config.sample.json:/app/config.json $(PROJECT):latest -s

.PHONY: jenkins
jenkins: docker
	docker tag $(PROJECT):latest localhost:5000/$(PROJECT):latest
	docker push localhost:5000/$(PROJECT):latest
	docker system prune -f

