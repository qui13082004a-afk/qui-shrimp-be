const blogService = require("../services/blog.service");

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, error) => res.status(400).json({ success: false, message: error.message });

const getUserId = (req) => req.user?.id_nguoi_dung || req.user?.id || req.id_nguoi_dung;

const create = async (req, res) => {
  try {
    const data = await blogService.createBlog(getUserId(req), req.body, false);
    ok(res, "Gửi bài viết chờ duyệt thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const createDraft = async (req, res) => {
  try {
    const data = await blogService.createBlog(getUserId(req), req.body, true);
    ok(res, "Lưu bản nháp thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const getPublic = async (req, res) => {
  try {
    const data = await blogService.getPublicBlogs(req.query);
    ok(res, "Lấy danh sách bài viết thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const getDetail = async (req, res) => {
  try {
    const data = await blogService.getBlogDetail(req.params.id, getUserId(req));
    ok(res, "Lấy chi tiết bài viết thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const getMine = async (req, res) => {
  try {
    const data = await blogService.getMyBlogs(getUserId(req), req.query);
    ok(res, "Lấy bài viết của tôi thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const updateMine = async (req, res) => {
  try {
    const data = await blogService.updateMyBlog(getUserId(req), req.params.id, req.body);
    ok(res, "Cập nhật bài viết thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const deleteMine = async (req, res) => {
  try {
    await blogService.deleteMyBlog(getUserId(req), req.params.id);
    ok(res, "Xóa bài viết thành công");
  } catch (error) {
    fail(res, error);
  }
};

const toggleLike = async (req, res) => {
  try {
    const data = await blogService.toggleLike(getUserId(req), req.params.id);
    ok(res, data.message, data);
  } catch (error) {
    fail(res, error);
  }
};

const getAdmin = async (req, res) => {
  try {
    const data = await blogService.getAdminBlogs(req.query);
    ok(res, "Lấy danh sách quản trị blog thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const approve = async (req, res) => {
  try {
    const data = await blogService.changeStatusByAdmin(req.params.id, "da_dang");
    ok(res, "Duyệt bài viết thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

const hide = async (req, res) => {
  try {
    const data = await blogService.changeStatusByAdmin(req.params.id, "an");
    ok(res, "Ẩn bài viết thành công", data);
  } catch (error) {
    fail(res, error);
  }
};

module.exports = {
  create,
  createDraft,
  getPublic,
  getDetail,
  getMine,
  updateMine,
  deleteMine,
  toggleLike,
  getAdmin,
  approve,
  hide,
};
