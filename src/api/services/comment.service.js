const blogRepository = require("../repositories/blog.repository");
const commentRepository = require("../repositories/comment.repository");

const createComment = async (id_nguoi_dung, id_bai_viet, payload) => {
  const blog = await blogRepository.findById(id_bai_viet);

  if (!blog || blog.trang_thai !== "da_dang") {
    throw new Error("Không tìm thấy bài viết đã đăng");
  }

  if (!payload.noi_dung || !payload.noi_dung.trim()) {
    throw new Error("Vui lòng nhập nội dung bình luận");
  }

  return commentRepository.create({
    id_bai_viet,
    id_nguoi_dung,
    noi_dung: payload.noi_dung.trim(),
    hinh_anh: payload.hinh_anh || null,
    id_binh_luan_cha: payload.id_binh_luan_cha || null,
  });
};

const replyComment = async (id_nguoi_dung, id_binh_luan_cha, payload) => {
  const parent = await commentRepository.findById(id_binh_luan_cha);

  if (!parent || parent.trang_thai !== "hien") {
    throw new Error("Không tìm thấy bình luận cha");
  }

  return createComment(id_nguoi_dung, parent.id_bai_viet, {
    ...payload,
    id_binh_luan_cha,
  });
};

const updateComment = async (id_nguoi_dung, id_binh_luan, payload) => {
  const comment = await commentRepository.findById(id_binh_luan);

  if (!comment) {
    throw new Error("Không tìm thấy bình luận");
  }

  const isOwner = Number(comment.id_nguoi_dung) === Number(id_nguoi_dung);
  if (!isOwner) {
    throw new Error("Bạn không có quyền sửa bình luận này");
  }

  if (!payload.noi_dung || !payload.noi_dung.trim()) {
    throw new Error("Vui lòng nhập nội dung bình luận");
  }

  return commentRepository.update(comment, {
    noi_dung: payload.noi_dung.trim(),
    hinh_anh: payload.hinh_anh || null,
  });
};

const deleteComment = async (user, id_binh_luan) => {
  const comment = await commentRepository.findById(id_binh_luan);

  if (!comment) {
    throw new Error("Không tìm thấy bình luận");
  }

  const isOwner = Number(comment.id_nguoi_dung) === Number(user.id_nguoi_dung);
  const isAdmin = user.vai_tro === "admin";

  if (!isOwner && !isAdmin) {
    throw new Error("Bạn không có quyền xóa bình luận này");
  }

  return commentRepository.remove(comment);
};

module.exports = {
  createComment,
  replyComment,
  updateComment,
  deleteComment,
};
