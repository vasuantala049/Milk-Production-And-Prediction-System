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

       

        stage("Detect Version From Commit Message") {
    steps {
        script {

            // Get latest commit message
            def commitMessage = sh(
                script: 'git log -1 --pretty=%B',
                returnStdout: true
            ).trim()

            echo "Commit message: >>>${commitMessage}<<<"

            // Extract version safely using sed
            def version = sh(
                script: '''
                    git log -1 --pretty=%B | \
                    sed -n 's/.*\\[\\(v[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+\\)\\].*/\\1/p'
                ''',
                returnStdout: true
            ).trim()

            if (version) {
                env.TAG_NAME = version
                echo "Release version detected: ${env.TAG_NAME}"
            } else {
                env.TAG_NAME = ""
                echo "No release version found"
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