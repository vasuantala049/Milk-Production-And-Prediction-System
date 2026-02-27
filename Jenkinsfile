@Library("sharedlib") _
pipeline {

    agent { label "vinod" }

    environment {
        DOCKER_USER    = "vasu049"
        FRONTEND_IMAGE = "dairy-flow-frontend"
        BACKEND_IMAGE  = "dairy-flow-backend"

        // Simple versioning
        TAG_NAME = "v1.0.${BUILD_NUMBER}"
    }

    stages {

        stage("Build Docker Images") {
            steps {
                echo "Building images with tag ${env.TAG_NAME}"

                sh """
                    docker build \
                    -t ${DOCKER_USER}/${FRONTEND_IMAGE}:${env.TAG_NAME} \
                    frontend/
                """

                sh """
                    docker build \
                    -t ${DOCKER_USER}/${BACKEND_IMAGE}:${env.TAG_NAME} \
                    backend/backend/
                """
            }
        }

        stage("Push Docker Images") {
            steps {
                echo "Pushing images with tag ${env.TAG_NAME}"

                sh "docker push ${DOCKER_USER}/${FRONTEND_IMAGE}:${env.TAG_NAME}"
                sh "docker push ${DOCKER_USER}/${BACKEND_IMAGE}:${env.TAG_NAME}"
            }
        }

        stage("Release Info") {
            steps {
                echo "Release ${env.TAG_NAME} pushed successfully."
                echo "ArgoCD ImageUpdater will detect the new tag and update Helm values."
            }
        }
    }
}
