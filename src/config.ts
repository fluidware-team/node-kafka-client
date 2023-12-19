/*
 * Copyright Fluidware srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EnvParse } from '@fluidware-it/saddlebag';

export const KAFKA_CLIENT_ID = EnvParse.envStringRequired('KAFKA_CLIENT_ID');
export const KAFKA_BROKERS = EnvParse.envStringList('KAFKA_BROKERS', ['kafka:9092']);
export const KAFKA_USE_SSL = EnvParse.envBool('KAFKA_USE_SSL', false);
export const KAFKA_SSL_REJECT_UNAUTHORIZED = EnvParse.envBool('KAFKA_SSL_REJECT_UNAUTHORIZED', true);
export const KAFKA_SSL_CA_PATH = EnvParse.envString('KAFKA_SSL_CA_PATH', '');
export const KAFKA_SSL_KEY_PEM_PATH = EnvParse.envString('KAFKA_SSL_KEY_PEM_PATH', '');
export const KAFKA_SSL_CERT_PEM_PATH = EnvParse.envString('KAFKA_SSL_CERT_PEM_PATH', '');
