FROM busybox
# Echo an ENV var to test setting it
# Echo file contents to test file upload
# nc to leave the container running
RUN echo $'#!/bin/bash \n\
  echo "Hello, ${NAME:-no-name}" \n\
  cat $FILE \n\
  exec nc -l -p 8888' > /entrypoint.sh
ENTRYPOINT ["sh", "/entrypoint.sh"]
