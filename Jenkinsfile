@Library("sharedlib") _
pipeline {

    agent { label "vinod" }

    environment {
        DOCKER_USER    = "vasu049"
        FRONTEND_IMAGE = "dairy-flow-frontend"
        BACKEND_IMAGE  = "dairy-flow-backend"
        TAG_NAME       = ""
    }

    stages {

        stage("Clone Code") {
            steps {
                script {
                    Clone("https://github.com/vasuantala049/Milk-Production-And-Prediction-System.git", "frontend")
                }
            }
        }

        stage("Detect Tag") {
            steps {
                script {
                    sh "git fetch --tags"

                    def tag = sh(
                        script: "git tag --points-at HEAD",
                        returnStdout: true
                    ).trim()

                    if (tag) {
                        env.TAG_NAME = tag
                        echo "Release tag detected: ${env.TAG_NAME}"
                    } else {
                        env.TAG_NAME = ""
                        echo "No tag on this commit"
                    }
                }
            }
        }

        stage("Build & Test") {
            steps {
                echo "Building project..."
            }
        }

        stage("Build Docker Images") {
            when {
                expression { env.TAG_NAME?.trim() }
            }
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
            when {
                expression { env.TAG_NAME?.trim() }
            }
            steps {
                script {
                    sh "docker push ${DOCKER_USER}/${FRONTEND_IMAGE}:${env.TAG_NAME}"
                    sh "docker push ${DOCKER_USER}/${BACKEND_IMAGE}:${env.TAG_NAME}"
                }
            }
        }

        stage("Update GitOps Repo") {
            when {
                expression { env.TAG_NAME?.trim() }
            }
            steps {
                echo "Release ${env.TAG_NAME} pushed. ArgoCD will sync automatically."
            }
        }
    }
}