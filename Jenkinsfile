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
                    Clone("https://github.com/vasuantala049/Milk-Production-And-Prediction-System.git", "main")
                }
            }
        }

        stage("Detect Version From Commit Message") {
    steps {
        script {
            def commitMessage = sh(
                script: "git log -1 --pretty=%B",
                returnStdout: true
            ).trim()

            echo "Latest commit message: ${commitMessage}"

            // Match [v1.0.5]
            def matcher = commitMessage =~ /\[(v\d+\.\d+\.\d+)\]/

            if (matcher) {
                env.TAG_NAME = matcher[0][1]
                echo "Release version detected: ${env.TAG_NAME}"
            } else {
                env.TAG_NAME = ""
                echo "No release version found in commit message"
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