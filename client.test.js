import test from 'node:test';
import assert from 'node:assert/strict';
import {RC4,frame} from './client.js';
test('RC4 published vector and continuous chunk state',()=>{const key=Buffer.from('Key'),plain=Buffer.from('Plaintext');assert.equal(new RC4(key).apply(plain).toString('hex'),'bbf316e8d940af0ad3');const r=new RC4(key);assert.equal(Buffer.concat([r.apply(plain.subarray(0,3)),r.apply(plain.subarray(3))]).toString('hex'),'bbf316e8d940af0ad3');});
test('gateway little-endian frame length excludes length prefix',()=>{assert.equal(frame(33,Buffer.from([1,2,3])).toString('hex'),'050000002100010203');});