#!/bin/sh
until mongosh --host db --eval "print(\"waited for connection\")"
do
  sleep 1
done

mongosh --host db --eval "rs.initiate({ _id: \"rs0\", members: [{_id: 0, host: \"localhost:27017\"},] })"