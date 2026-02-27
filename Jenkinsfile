@Library("sharedlib") _
pipeline {

    agent { label "vinod" }

    environment {
        DOCKER_USER    = "vasu049"
        FRONTEND_IMAGE = "dairy-flow-frontend"
        BACKEND_IMAGE  = "dairy-flow-backend"
        TAG_NAME       = "latest"
    }

    stages {


        stage("Build & Test") {
            steps {
                echo "Building project..."
            }
        }

        stage("Build Docker Images") {
            
            steps {
                script {
                    echo "Building Docker images with tag ${env.TAG_NAME}"

                    // Frontend build
                    sh """
                        docker build \
                        -t ${DOCKER_USER}/${FRONTEND_IMAGE}:${env.TAG_NAME} \
                        frontend/
                    """

                    // Backend build
                    sh """
                        docker build \
                        -t ${DOCKER_USER}/${BACKEND_IMAGE}:${env.TAG_NAME} \
                        backend/backend/
                    """
                }
            }
        }

        stage("Push Docker Images") {
            
            steps {
                script {
                    sh "docker push ${DOCKER_USER}/${FRONTEND_IMAGE}:${env.TAG_NAME}"
                    sh "docker push ${DOCKER_USER}/${BACKEND_IMAGE}:${env.TAG_NAME}"
                }
            }
        }

        stage("Update GitOps Repo") {
            
            steps {
                echo "Release ${env.TAG_NAME} pushed. ArgoCD will sync automatically."
            }
        }
    }
}