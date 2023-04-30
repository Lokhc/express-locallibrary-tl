const mongoose = require('mongoose');

// define a schema
const Schema = mongoose.Schema;

const someModelSchema = new Schema({
    a_string: String,
    a_date: Date
});

// compile Model from schema
const someModel = mongoose.model("SomeModel", someModelSchema);

// creating a instance from a model 
const instance_model = new someModel({name: 'awesome'});

// saving the new model instance
instance_model.save((err) => {
    if(err) return hadleError(err);
    // saved!
});

// creating and saving an model instance at the same time
someModel.create({name: 'new model name'}, (err, newModel) => {
    if(err) hadleError(error);
    // saved;
});

// accesing to the fields of the new record
console.log(instance_model.name);

// changing record by modifiying the fields, then calling save
instance_model.name = "new name";
instance_model.save((err) => {
    if(err) handleError(err);
    // saved
});

// searching for records

const athleteSchema = new Schema({
    name: String,
    age: Integer,
    sport: String
})

const Athlete = new mongoose.model('Athlete', athleteSchema);

// find all atletes who play tennis, selecting the "name" and "age" fields
Athlete.find({ sport: "Tennis" }, "name age", (err, athlete) => {
    if(err) return handleError(err);
    // do something with athlete, param wich contains the athletes tha matche criteria
});


const query = Athlete.find({sport: "Tennis"});
query.select('name age');
query.limit(5);
query.sort({ age: -1 });
// execute the query at a later time
query.exec((err, result) => {
    if(err) handleError(err);
    // athletes contains an ordered list of 5 athletes who play Tennis
});


Athlete.find()
.where("sports")
.equals("Tennis")
.where("age")
.gt(17)
.lt(50) // additional where query
.limit(5)
.sort({age: -1})
.select("name age")
.exec(callback); // where callback is the name of the callback function


const authorSchema = new Schema({
    name: String,
    stories: [{ type: Schema.Types.objectId, ref: "Story" }]
});

const storySchema = new Schema({
    author: { type: Schema.Types.objectId },
    title: String
});

const Story = mongoose.model('Story', storySchema);
const Author = mongoose.model('Author', authorSchema);

const bob = new Author({ name: "Bob Smith" });

bob.save((err) => {
    if(err) handleError(err);
    // bob exist, creating story
    const story = new Story({ 
        title: "Bob goes sleeding",
        author: bob._id
    });

    story.save((err) => {
        if(err) handleError(err);
        // bob now has his story
    });
});

Story.findOne({ title: 'Bob goes sleeding' })
.populate('author')
.exec((err, story) => {
    if(err) handleError(err);
    console.log('the autor is ' + story.author.name);
});

Story.find({ author: bob._id })
.exec((err, story) => {
    if(err) handleError(err);
    // return all storys that have Bobs id as their author 
});