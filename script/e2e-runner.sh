if [[ ${TRAVIS_OS_NAME} = "linux" ]]; then
  export DISPLAY=:99.0
  sh -e /etc/init.d/xvfb start;
  sleep 3
fi

npm install grunt-cli -g
grunt pre-build
npm run test:e2e
