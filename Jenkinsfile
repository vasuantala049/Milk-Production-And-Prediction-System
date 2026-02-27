@Library("sharedlib") _
pipeline {

    agent { label "vinod" }

    environment {
        DOCKER_USER = "vasu049"
        FRONTEND_IMAGE = "dairy-flow-frontend"
        BACKEND_IMAGE = "dairy-flow-backend"
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
                    TAG_NAME = sh(script: "git describe --tags --exact-match || echo 'no-tag'", returnStdout: true).trim()
                    echo "Tag detected: ${TAG_NAME}"
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
                expression { TAG_NAME != "no-tag" }
            }
            steps {
                script {
                    dockerbuild(FRONTEND_IMAGE, TAG_NAME, DOCKER_USER)
                    dockerbuild(BACKEND_IMAGE, TAG_NAME, DOCKER_USER)
                }
            }
        }

        stage("Push Docker Images") {
            when {
                expression { TAG_NAME != "no-tag" }
            }
            steps {
                script {
                    dockerpush(FRONTEND_IMAGE, TAG_NAME, DOCKER_USER)
                    dockerpush(BACKEND_IMAGE, TAG_NAME, DOCKER_USER)
                }
            }
        }

        stage("Update GitOps Repo") {
            when {
                expression { TAG_NAME != "no-tag" }
            }
            steps {
                echo "Release ${TAG_NAME} pushed. ArgoCD will sync automatically."
            }
        }
    }
}