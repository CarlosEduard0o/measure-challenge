run-backend:
	docker-compose -f docker-compose-run-application.yaml down
	docker-compose -f docker-compose-run-application.yaml stop
	docker-compose -f docker-compose-run-application.yaml build --force-rm
	docker-compose -f docker-compose-run-application.yaml up