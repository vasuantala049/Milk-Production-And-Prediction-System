@Library("sharedlib") _
pipeline {

    agent { label "vinod" }

    environment {
        DOCKER_USER    = "vasu049"
        FRONTEND_IMAGE = "dairy-flow-frontend"
        BACKEND_IMAGE  = "dairy-flow-backend"
        TAG_NAME       = "v1.0.${BUILD_NUMBER}"
    }

    stages {

        stage("Check Trigger Source") {
            steps {
                script {
                    sh "git fetch --all"

                    def author = sh(
                        script: "git log -1 --pretty=format:'%an'",
                        returnStdout: true
                    ).trim()

                    echo "Last commit author: ${author}"

                    if (author == "argocd-image-updater") {
                        echo "Triggered by ImageUpdater. Skipping build."

                        // Set a global flag
                        env.SKIP_PIPELINE = "true"
                        currentBuild.result = 'NOT_BUILT'
                    } else {
                        env.SKIP_PIPELINE = "false"
                    }
                }
            }
        }

        stage("Build Docker Images") {
            when {
                expression { env.SKIP_PIPELINE != "true" }
            }
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
            when {
                expression { env.SKIP_PIPELINE != "true" }
            }
            steps {
                sh "docker push ${DOCKER_USER}/${FRONTEND_IMAGE}:${env.TAG_NAME}"
                sh "docker push ${DOCKER_USER}/${BACKEND_IMAGE}:${env.TAG_NAME}"
            }
        }

        stage("Release Info") {
            when {
                expression { env.SKIP_PIPELINE != "true" }
            }
            steps {
                echo "Released version ${env.TAG_NAME}"
                echo "ArgoCD ImageUpdater will update automatically."
            }
        }
    }
}
