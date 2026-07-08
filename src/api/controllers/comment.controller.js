const commentService = require("../services/comment.service");

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, error) => res.status(400).json({ success: false, message: error.message });
const getUserId = (req) => req.user?.id_nguoi_dung || req.user?.id || req.id_nguoi_dung;

const create = async (req, res) => {
  try {
    const data = await commentService.createComment(getUserId(req), req.params.id, req.body);
    ok(res, "Bình luận thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const reply = async (req, res) => {
  try {
    const data = await commentService.replyComment(getUserId(req), req.params.id, req.body);
    ok(res, "Trả lời bình luận thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const update = async (req, res) => {
  try {
    const data = await commentService.updateComment(getUserId(req), req.params.id, req.body);
    ok(res, "Cập nhật bình luận thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const remove = async (req, res) => {
  try {
    await commentService.deleteComment(req.user, req.params.id);
    ok(res, "Xóa bình luận thành công");
  } catch (error) {
    fail(res, error);
  }
};

module.exports = {
  create,
  reply,
  update,
  remove,
};
