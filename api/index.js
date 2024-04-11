import bodyParser from "body-parser";
import express from "express";
import { MongoClient } from "mongodb";

const api = new express.Router();
const DATABASE_NAME = "Assign3";

let USERS;
let POSTS;

const initApi = async (app) => {
  app.set("json spaces", 2);
  app.use("/api", api);

  let conn = await MongoClient.connect("mongodb://localhost:27017");
  let db = conn.db(DATABASE_NAME);

  USERS = db.collection("users");
  POSTS = db.collection("posts");
};


api.use(bodyParser.json());

api.get("/", (req, res) => {
  res.json({ db: "local_api", numUsers: 1, numPosts: 1 });
});

api.get("/tests/get", (req, res) => {
  let value = req.query.value || null;

  res.json({ success: true, value });
});

api.post("/tests/post", (req, res) => {
  let value = req.body.value || null;

  res.json({ success: true, value });
});

api.get("/tests/error", (req, res) => {
  res.status(499).json({ error: "Test error" });
});

api.all("/tests/echo", (req, res) => {
  res.json({
    method: req.method,
    query: req.query,
    body: req.body
  });
});
// api.get("/users", ...): Lấy danh sách tất cả người dùng.
// api.get("/users/:id", ...): Lấy thông tin của một người dùng dựa trên ID.
// api.get("/users/:id/feed", ...): Lấy bài đăng của người dùng và người mà người dùng đó đang theo dõi.
api.get("/users", async (req, res) => {
  let users = await USERS.find().toArray();
  let usersId = [];

  users.forEach((dataUser) => {
    usersId.push(dataUser.id);
  });

  res.json({ users: usersId });
});

api.get("/users/:id", async (req, res) => {
  let id = req.params.id;
  let user = await USERS.findOne({ id: id });

  res.json(user);
});

api.get("/users/:id/feed", async (req, res) => {
  // Dòng mã let id = req.params.id; được sử dụng để trích xuất tham số id từ đường dẫn URL của yêu cầu HTTP.
  // Trong Express.js, req.params là một đối tượng chứa các tham số được trích xuất từ đường dẫn URL.
  let id = req.params.id;
  let posts = await POSTS.find({ userId: id }).toArray();
  let userPost = await USERS.findOne({ id: id });

  let listFollowingId = userPost.following;
  let listFollowing = [];

  await Promise.all(listFollowingId.map(async (idFollow) => {
    let user = await USERS.findOne({ id: idFollow });
    listFollowing.push(user);
  }));

  await Promise.all(listFollowing.map(async (user) => {
    let postUser = await POSTS.find({ userId: user.id }).toArray();

    posts = [...posts, ...postUser];
  }));
  let postsFeed = [];

  posts.forEach((data) => {
    let userFollowing = listFollowing.find((user) => user.id === data.userId);
    let userName = userFollowing ? userFollowing.name : userPost.name;
    let userAvatarURL = userFollowing ? userFollowing.avatarURL : userPost.avatarURL;

    postsFeed.push({
      user: {
        id: data.userId,
        name: userName,
        avatarURL: userAvatarURL

      },
      time: data.time,
      text: data.text
    });
  });

  postsFeed.sort((a, b) => new Date(b.time) - new Date(a.time));

  res.json({ posts: postsFeed });
});

//Post
// api.post("/users/:id", ...): Tạo một người dùng mới.
// api.post("/posts/:id", ...): Tạo một bài đăng mới.
// api.put("/users/:id/addfollowing", ...): Thêm một người dùng vào danh sách theo dõi của người dùng khác.
api.post("/users/:id", async (req, res) => {
  let data = req.body.user;
  await USERS.insertOne(data);
  res.json(data);
});

api.post("/posts/:id", async (req, res) => {
  let data = req.body.post;
  await POSTS.insertOne(data);
  res.json(data);
});
// api.put("/users/:id/addfollowing", ...): Thêm một người dùng vào danh sách theo dõi của người dùng khác.
api.put("/users/:id/addfollowing", async (req, res) => {
  let userId = req.body.id;
  let idFollow = req.body.idFollow;
  let userFollow = await USERS.findOne({ id: idFollow });
  let user = await USERS.findOne({ id: userId });
  if (!userFollow || userFollow.id === user.id) {
    res.json({ status: 404, mes: "Error" });
    return;
  }
  user.following.push(idFollow);
  await USERS.replaceOne({ id: user.id }, user);
  res.json(user);
});

// api.put("/users/:id/deletefollowing", ...): Xóa một người dùng khỏi danh sách theo dõi của người dùng khác.
api.put("/users/:id/deletefollowing", async (req, res) => {
  let userId = req.body.id;
  let deleteId = req.body.deleteId;
  let user = await USERS.findOne({ id: userId });
  let deleteIndex = user.following.indexOf(deleteId);
  let newFollower = user.following.filter((id, index) => index !== deleteIndex);
  if (deleteIndex === -1 ) {
    res.json({ status: 404, mes: "Error" });
    return;
  }
  user.following = newFollower;
  await USERS.replaceOne({ id: user.id }, user);
  res.json(user);
});

//UPDATE
// api.put("/users/:id", ...): Cập nhật thông tin của một người dùng.
api.put("/users/:id", async (req, res) => {
  let user = req.body;

  await USERS.replaceOne({ id: user.id }, user);

  res.json(user);
});

/* This is a catch-all route that logs any requests that weren't handled above.
   Useful for seeing whether other requests are coming through correctly */
api.all("/*", (req, res) => {
  let data = {
    method: req.method,
    path: req.url,
    query: req.query,
    body: req.body
  };
  console.log(data);
  res.status(500).json({ error: "Not implemented" });
});

export default initApi;
