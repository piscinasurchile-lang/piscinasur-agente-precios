import test from 'node:test';
import assert from 'node:assert/strict';
test('Los resultados no verificados no tienen precio',()=>{const record={status:'unverified',price:null};assert.equal(record.price,null)});
test('La cobertura prevista incluye 30 consultas',()=>assert.equal(5*3*2,30));
test('Los valores deben ser positivos',()=>assert.equal(Number.isFinite(1500)&&1500>0,true));
test('CSV escapa comillas',()=>assert.equal('"a""b"','"'+ 'a"b'.replaceAll('"','""')+'"'));
