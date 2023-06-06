import { MONGO_DB_ENDPOINT } from '$env/static/private';
import mongoose from 'mongoose';

mongoose.connect(MONGO_DB_ENDPOINT);
