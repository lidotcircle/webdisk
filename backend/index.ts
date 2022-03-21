import express from 'express';
export { initializeDataSource, getDataSource } from './repository/data-source';

export const App = express();
App.use('/', require('./routes').default);
