/* global describe, it, expect, beforeEach, beforeAll afterAll */
const dotenv = require('dotenv');

dotenv.config();
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const sequelize = require('../../src/utils/database');

const agent = supertest(app);
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let tokenClient;
let idClient;

beforeAll(async () => {
  await agent.post('/clients/signup').send({
    name: 'client',
    email: 'client@gmail.com',
    password: '123456',
    confirmPassword: '123456',
  });

  const response = await agent.post('/clients/signin').send({
    email: 'client@gmail.com',
    password: '123456',
  });

  idClient = response.body.id;
  tokenClient = response.body.token;
});

beforeEach(async () => {
  await db.query('DELETE FROM "theoryUsers"');
  await db.query('DELETE FROM "exerciseUsers"');
  await db.query('DELETE FROM exercises');
  await db.query('DELETE FROM theories');
  await db.query('DELETE FROM topics');
  await db.query('DELETE FROM chapters');
  await db.query('DELETE FROM "courseUsers"');
  await db.query('DELETE FROM courses');
});

afterAll(async () => {
  await db.query('DELETE FROM "theoryUsers"');
  await db.query('DELETE FROM "exerciseUsers"');
  await db.query('DELETE FROM exercises');
  await db.query('DELETE FROM theories');
  await db.query('DELETE FROM topics');
  await db.query('DELETE FROM chapters');
  await db.query('DELETE FROM "courseUsers"');
  await db.query('DELETE FROM courses');
  await db.query('DELETE FROM users');
  await sequelize.close();
  await db.end();
});

describe('GET /clients/courses/:id', () => {
  it('should return 200 when passed valid Id', async () => {
    const course = {
      name: 'JavaScript21122',
      image: 'https://static.imasters.com.br/wp-content/uploads/2018/12/10164438/javascript.jpg',
      description: 'JavaScript do Zero',
    };
    const chapter = {
      name: 'Apresentação Programação',
      topics: [
        {
          name: 'Introdução a programação',
        },
      ],
    };
    const theory = {
      youtubeLink: 'https://www.youtube.com/embed/Ptbk2af68e8',
    };

    const resultCourse = await db.query('INSERT INTO courses (name, image, description) values ($1, $2, $3) RETURNING *', [course.name, course.image, course.description]);
    const courseId = resultCourse.rows[0].id;

    const resultChapter = await db.query('INSERT INTO chapters (name, "courseId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [chapter.name, courseId, Sequelize.NOW, Sequelize.NOW]);
    const chapterId = resultChapter.rows[0].id;

    const resultTopic = await db.query('INSERT INTO topics (name, "chapterId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [chapter.topics[0].name, chapterId, Sequelize.NOW, Sequelize.NOW]);
    const topicId = resultTopic.rows[0].id;

    const resultTheory = await db.query('INSERT INTO theories ("youtubeLink", "topicId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [theory.youtubeLink, topicId, Sequelize.NOW, Sequelize.NOW]);

    await db.query('INSERT INTO exercises ("baseCode", "topicId", "createdAt", "updatedAt", "testCode", "statement", "solutionCode", position) values ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', ['Base Code', topicId, Sequelize.NOW, Sequelize.NOW, 'Test Code', 'Statement', 'Solution Code', 1]);
    const response = await agent.get(`/clients/courses/${courseId}`).set({ 'X-Access-Token': tokenClient });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      id: courseId,
      name: course.name,
      image: course.image,
      description: course.description,
      progress: 0,
      started: false,
      chapters: [
        {
          id: chapterId,
          name: chapter.name,
          theoryCount: 1,
          exerciseCount: 1,
          topics: [
            {
              id: topicId,
              name: chapter.topics[0].name,
              theoryId: resultTheory.rows[0].id,
              done: false,
            },
          ],
        },
      ],
    }));
  });

  it('should return status 403 when passed invalid id', async () => {
    const response = await agent.get('/clients/courses/1').set({ 'X-Access-Token': tokenClient });
    expect(response.status).toBe(403);
  });
});

describe('GET /clients/courses/:id/activities', () => {
  it('should return 200 when passed valid Id', async () => {
    const course = {
      name: 'JavaScript21122',
      image: 'https://static.imasters.com.br/wp-content/uploads/2018/12/10164438/javascript.jpg',
      description: 'JavaScript do Zero',
    };
    const chapter = {
      name: 'Apresentação Programação',
      topics: [
        {
          name: 'Introdução a programação',
        },
      ],
    };
    const theory = {
      youtubeLink: 'https://www.youtube.com/embed/Ptbk2af68e8',
    };

    const resultCourse = await db.query('INSERT INTO courses (name, image, description) values ($1, $2, $3) RETURNING *', [course.name, course.image, course.description]);
    const courseId = resultCourse.rows[0].id;

    const resultChapter = await db.query('INSERT INTO chapters (name, "courseId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [chapter.name, courseId, Sequelize.NOW, Sequelize.NOW]);
    const chapterId = resultChapter.rows[0].id;

    const resultTopic = await db.query('INSERT INTO topics (name, "chapterId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [chapter.topics[0].name, chapterId, Sequelize.NOW, Sequelize.NOW]);
    const topicId = resultTopic.rows[0].id;

    const resultTheory = await db.query('INSERT INTO theories ("youtubeLink", "topicId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [theory.youtubeLink, topicId, Sequelize.NOW, Sequelize.NOW]);
    const theoryId = resultTheory.rows[0].id;

    const resultExercise = await db.query('INSERT INTO exercises ("baseCode", "topicId", "createdAt", "updatedAt", "testCode", "statement", "solutionCode", position) values ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', ['Base Code', topicId, Sequelize.NOW, Sequelize.NOW, 'Test Code', 'Statement', 'Solution Code', 1]);
    const exerciseId = resultExercise.rows[0].id;

    const response = await agent.get(`/clients/courses/${courseId}/activities`).set({ 'X-Access-Token': tokenClient });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      id: courseId,
      name: course.name,
      image: course.image,
      description: course.description,
      chapters: [
        {
          id: chapterId,
          name: chapter.name,
          topics: [
            {
              id: topicId,
              name: chapter.topics[0].name,
              theory: {
                id: theoryId,
                youtubeLink: theory.youtubeLink,
                theoryUsers: [],
              },
              exercises: [
                {
                  id: exerciseId,
                  baseCode: resultExercise.rows[0].baseCode,
                  testCode: resultExercise.rows[0].testCode,
                  solutionCode: resultExercise.rows[0].solutionCode,
                  statement: resultExercise.rows[0].statement,
                  position: 1,
                  exerciseUsers: [],
                },
              ],
            },
          ],
        },
      ],
    }));
  });

  it('should return status 403 when passed invalid id', async () => {
    const response = await agent.get('/clients/courses/1/activities').set({ 'X-Access-Token': tokenClient });
    expect(response.status).toBe(403);
  });
});

describe('GET /clients/courses', () => {
  it('should return 200 with courses array', async () => {
    const course = {
      name: 'JavaScriptOne',
      image: 'https://static.imasters.com.br/wp-content/uploads/2018/12/10164438/javascript.jpg',
      description: 'JavaScript do Zero',
    };

    const resultCourse = await db.query('INSERT INTO courses (name, image, description) values ($1, $2, $3) RETURNING *', [course.name, course.image, course.description]);
    const courseId = resultCourse.rows[0].id;

    const response = await agent.get('/clients/courses').set({ 'X-Access-Token': tokenClient });

    expect(response.status).toBe(200);
    expect.arrayContaining({
      id: courseId,
      name: course.name,
      deleted: false,
      image: course.image,
      description: course.description,
    });
  });
});

describe('POST /clients/courses/:id', () => {
  it('should return 200 when course is successfully started or resumed', async () => {
    const course = {
      name: 'JavaScript21122',
      image: 'https://static.imasters.com.br/wp-content/uploads/2018/12/10164438/javascript.jpg',
      description: 'JavaScript do Zero',
    };
    const chapter = {
      name: 'Apresentação Programação',
      topics: [
        {
          name: 'Introdução a programação',
        },
      ],
    };
    const theory = {
      youtubeLink: 'https://www.youtube.com/embed/Ptbk2af68e8',
    };

    const resultCourse = await db.query('INSERT INTO courses (name, image, description) values ($1, $2, $3) RETURNING *', [course.name, course.image, course.description]);
    const courseId = resultCourse.rows[0].id;

    const resultChapter = await db.query('INSERT INTO chapters (name, "courseId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [chapter.name, courseId, Sequelize.NOW, Sequelize.NOW]);
    const chapterId = resultChapter.rows[0].id;

    const resultTopic = await db.query('INSERT INTO topics (name, "chapterId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [chapter.topics[0].name, chapterId, Sequelize.NOW, Sequelize.NOW]);
    const topicId = resultTopic.rows[0].id;

    const resultTheory = await db.query('INSERT INTO theories ("youtubeLink", "topicId", "createdAt", "updatedAt") values ($1, $2, $3, $4) RETURNING *', [theory.youtubeLink, topicId, Sequelize.NOW, Sequelize.NOW]);
    const theoryId = resultTheory.rows[0].id;

    const response = await agent.post(`/clients/courses/${courseId}`).set({ 'X-Access-Token': tokenClient });
    expect(response.status).toBe(200);
    expect.objectContaining({
      courseId,
      chapterId,
      topicId,
      theoryId,
    });
  });

  it('should throw an error when course does not have chapters, topics or theories', async () => {
    const course = {
      name: 'JavaScript21122',
      image: 'https://static.imasters.com.br/wp-content/uploads/2018/12/10164438/javascript.jpg',
      description: 'JavaScript do Zero',
    };

    const resultCourse = await db.query('INSERT INTO courses (name, image, description) values ($1, $2, $3) RETURNING *', [course.name, course.image, course.description]);
    const courseId = resultCourse.rows[0].id;

    const response = await agent.post(`/clients/courses/${courseId}`).set({ 'X-Access-Token': tokenClient });
    expect(response.status).toBe(403);
  });
});

describe('GET /clients/courses/started', () => {
  it('should return all started courses by the specified user', async () => {
    const courseOne = {
      name: 'Vue.js do zero!',
      description: 'Aprenda Vue.js do zero ao avançado, com muita prática!',
      image: 'https://i.ytimg.com/vi/Wy9q22isx3U/maxresdefault.jpg',
    };

    const courseTwo = {
      name: 'Angular do zero!',
      description: 'Aprenda Angular do zero ao avançado, com muita prática!',
      image: 'https://blog.trainning.com.br/wp-content/uploads/2018/06/Why-AngularJS-A1.jpg',
    };

    const testCourseOne = await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseOne.name, courseOne.description, courseOne.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    const testCourseTwo = await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseTwo.name, courseTwo.description, courseTwo.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    await db.query('INSERT INTO "courseUsers" ("courseId", "userId", "createdAt", "updatedAt", "lastAccessed") values ($1, $2, $3, $4, $5)', [
      testCourseOne.rows[0].id, idClient, Sequelize.NOW, Sequelize.NOW, Sequelize.NOW,
    ]);

    await db.query('INSERT INTO "courseUsers" ("courseId", "userId", "createdAt", "updatedAt", "lastAccessed") values ($1, $2, $3, $4, $5)', [
      testCourseTwo.rows[0].id, idClient, Sequelize.NOW, Sequelize.NOW, Sequelize.NOW,
    ]);

    const result = await agent.get('/clients/courses/started').set({ 'X-Access-Token': tokenClient });

    expect(result.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: courseOne.name,
          deleted: false,
          image: courseOne.image,
          description: courseOne.description,
        }),
        expect.objectContaining({
          name: courseTwo.name,
          deleted: false,
          image: courseTwo.image,
          description: courseTwo.description,
        }),
      ]),
    );
  });

  it('should return status 404 when no course has been started', async () => {
    const courseOne = {
      name: 'Vue.js do zero!',
      description: 'Aprenda Vue.js do zero ao avançado, com muita prática!',
      image: 'https://i.ytimg.com/vi/Wy9q22isx3U/maxresdefault.jpg',
    };

    const courseTwo = {
      name: 'Angular do zero!',
      description: 'Aprenda Angular do zero ao avançado, com muita prática!',
      image: 'https://blog.trainning.com.br/wp-content/uploads/2018/06/Why-AngularJS-A1.jpg',
    };

    await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseOne.name, courseOne.description, courseOne.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseTwo.name, courseTwo.description, courseTwo.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    const response = await agent.get('/clients/courses/started').set({ 'X-Access-Token': tokenClient });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Nenhum curso iniciado.');
  });
});

describe('GET /clients/courses/last-accessed', () => {
  it('should return the last accessed course by the specified user', async () => {
    const courseOne = {
      name: 'Vue.js do zero!',
      description: 'Aprenda Vue.js do zero ao avançado, com muita prática!',
      image: 'https://i.ytimg.com/vi/Wy9q22isx3U/maxresdefault.jpg',
    };

    const courseTwo = {
      name: 'Angular do zero!',
      description: 'Aprenda Angular do zero ao avançado, com muita prática!',
      image: 'https://blog.trainning.com.br/wp-content/uploads/2018/06/Why-AngularJS-A1.jpg',
    };

    const testCourseOne = await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseOne.name, courseOne.description, courseOne.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    const testCourseTwo = await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseTwo.name, courseTwo.description, courseTwo.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    await db.query('INSERT INTO "courseUsers" ("courseId", "userId", "createdAt", "updatedAt", "lastAccessed") values ($1, $2, $3, $4, $5)', [
      testCourseOne.rows[0].id, idClient, Sequelize.NOW, Sequelize.NOW, Sequelize.NOW,
    ]);

    await db.query('INSERT INTO "courseUsers" ("courseId", "userId", "createdAt", "updatedAt", "lastAccessed") values ($1, $2, $3, $4, $5)', [
      testCourseTwo.rows[0].id, idClient, Sequelize.NOW, Sequelize.NOW, Sequelize.NOW,
    ]);

    const result = await agent.get('/clients/courses/last-accessed').set({ 'X-Access-Token': tokenClient });

    expect(result.body).toMatchObject(
      expect.objectContaining({
        name: courseTwo.name,
        deleted: false,
        image: courseTwo.image,
        description: courseTwo.description,
      }),
    );
  });

  it('should return status 404 when no course has been started', async () => {
    const courseOne = {
      name: 'Vue.js do zero!',
      description: 'Aprenda Vue.js do zero ao avançado, com muita prática!',
      image: 'https://i.ytimg.com/vi/Wy9q22isx3U/maxresdefault.jpg',
    };

    const courseTwo = {
      name: 'Angular do zero!',
      description: 'Aprenda Angular do zero ao avançado, com muita prática!',
      image: 'https://blog.trainning.com.br/wp-content/uploads/2018/06/Why-AngularJS-A1.jpg',
    };

    await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseOne.name, courseOne.description, courseOne.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    await db.query('INSERT INTO courses (name, description, image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5) RETURNING *', [
      courseTwo.name, courseTwo.description, courseTwo.image, Sequelize.NOW, Sequelize.NOW,
    ]);

    const response = await agent.get('/clients/courses/last-accessed').set({ 'X-Access-Token': tokenClient });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Nenhum curso iniciado.');
  });
});
