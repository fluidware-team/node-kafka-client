
## Environment variables

| ENV                                    |     type |    default | required |                                                                                                                                                       notes |
| -------------------------------------- | -------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KAFKA_${prefix}BROKERS                 | string[] | kafka:9092 |          |                                                                                                                                                             |
| KAFKA_${prefix}CLIENT_ID               |   string |            |        * | "prefix" is not required, can be used to have multiple kafka configurations: i.e: KAFKA_INSTANCE_A_CLIENT_ID=consumerA KAFKA_INSTANCE_B_CLIENT_ID=consumerB |
| KAFKA_${prefix}SSL_CA_PATH             |   string |            |          |                                                                                                                                                             |
| KAFKA_${prefix}SSL_CERT_PEM_PATH       |   string |            |          |                                                                                                                                                             |
| KAFKA_${prefix}SSL_KEY_PEM_PATH        |   string |            |          |                                                                                                                                                             |
| KAFKA_${prefix}SSL_REJECT_UNAUTHORIZED |  boolean |       true |          |                                                                                                                                                             |
| KAFKA_${prefix}USE_SSL                 |  boolean |      false |          |                                                                                                                                                             |
