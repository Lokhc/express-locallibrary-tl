const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const mongoDB = 'mongodb+srv://local_library:local_library_pass@cluster01.jh7kqop.mongodb.net/?retryWrites=true&w=majority';

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(mongoDB);
}


