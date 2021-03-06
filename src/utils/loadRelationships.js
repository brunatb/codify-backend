const Course = require('../models/Course');
const CourseUser = require('../models/CourseUser');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Theory = require('../models/Theory');
const Exercise = require('../models/Exercise');
const TheoryUser = require('../models/TheoryUser');
const ExerciseUser = require('../models/ExerciseUser');

Course.belongsToMany(User, { through: CourseUser });
User.belongsToMany(Course, { through: CourseUser });
Course.hasMany(Chapter);
Chapter.belongsTo(Course);
Course.hasMany(CourseUser);
Chapter.hasMany(Topic, { onDelete: 'CASCADE' });
Topic.belongsTo(Chapter, { onDelete: 'CASCADE' });
Topic.hasOne(Theory, { onDelete: 'CASCADE' });
Theory.belongsTo(Topic, { onDelete: 'CASCADE' });
Topic.hasMany(Exercise, { onDelete: 'CASCADE' });
Exercise.belongsTo(Topic, { onDelete: 'CASCADE' });
Theory.belongsToMany(User, { through: TheoryUser });
User.belongsToMany(Theory, { through: TheoryUser });
Exercise.belongsToMany(User, { through: ExerciseUser });
User.belongsToMany(Exercise, { through: ExerciseUser });
Theory.hasMany(TheoryUser);
Exercise.hasMany(ExerciseUser);
