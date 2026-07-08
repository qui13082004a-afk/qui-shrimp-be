const blogRepository = require("../repositories/blog.repository");
const commentRepository = require("../repositories/comment.repository");

const toNumber = (value, defaultValue) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : defaultValue;
};

const makeSlug = (text = "") =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildPagination = (count, page, limit) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit),
});

const formatCommentsTree = (comments) => {
  const plainComments = comments.map((comment) => comment.toJSON());
  const map = new Map();
  const roots = [];

  plainComments.forEach((comment) => {
    comment.replies = [];
    map.set(Number(comment.id_binh_luan), comment);
  });

  plainComments.forEach((comment) => {
    if (comment.id_binh_luan_cha && map.has(Number(comment.id_binh_luan_cha))) {
      map.get(Number(comment.id_binh_luan_cha)).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
};
const createBlog = async (id_nguoi_dung, payload, isDraft = false) => {
  const { tieu_de, noi_dung, tom_tat, hinh_anh } = payload;

  if (!tieu_de || !noi_dung) {
    throw new Error("Vui lòng nhập tiêu đề và nội dung bài viết");
  }

  const blog = await blogRepository.create({
    id_nguoi_dung,
    tieu_de: tieu_de.trim(),
    slug: `${makeSlug(tieu_de)}-${Date.now()}`,
    tom_tat: tom_tat || noi_dung.replace(/<[^>]*>/g, "").slice(0, 180),
    noi_dung,
    hinh_anh: hinh_anh || null,
    trang_thai: isDraft ? "ban_nhap" : "cho_duyet",
  });

  return blog;
};

const getPublicBlogs = async (query) => {
  const page = toNumber(query.page, 1);
  const limit = toNumber(query.limit, 9);
  const result = await blogRepository.findPublic({
    keyword: query.keyword || "",
    sort: query.sort || "newest",
    page,
    limit,
  });

  return {
    data: result.rows,
    pagination: buildPagination(result.count, page, limit),
  };
};

const getBlogDetail = async (id_bai_viet, id_nguoi_dung = null) => {
  const blog = await blogRepository.findById(id_bai_viet);

  if (!blog) {
    throw new Error("Không tìm thấy bài viết");
  }

  const plain = blog.toJSON();
  const isOwner = id_nguoi_dung && Number(plain.id_nguoi_dung) === Number(id_nguoi_dung);
  const isPublished = plain.trang_thai === "da_dang";

  if (!isPublished && !isOwner) {
    throw new Error("Bài viết chưa được công khai");
  }

  if (isPublished) {
    await blogRepository.increaseView(blog);
  }

  const comments = await commentRepository.findVisibleByBlog(id_bai_viet);
  plain.comments = formatCommentsTree(comments);
  return plain;
};

const getMyBlogs = async (id_nguoi_dung, query) => {
  const page = toNumber(query.page, 1);
  const limit = toNumber(query.limit, 10);
  const result = await blogRepository.findMine({
    id_nguoi_dung,
    trang_thai: query.trang_thai || "tat_ca",
    page,
    limit,
  });

  return {
    data: result.rows,
    pagination: buildPagination(result.count, page, limit),
  };
};

const updateMyBlog = async (id_nguoi_dung, id_bai_viet, payload) => {
  const blog = await blogRepository.findByIdWithOwner(id_bai_viet, id_nguoi_dung);

  if (!blog) {
    throw new Error("Không tìm thấy bài viết của bạn");
  }

  if (blog.trang_thai === "da_dang") {
    payload.trang_thai = "cho_duyet";
  }

  const data = {
    ...payload,
    ngay_cap_nhat: new Date(),
  };

  if (payload.tieu_de) {
    data.slug = makeSlug(payload.tieu_de);
  }

  return blogRepository.update(blog, data);
};

const deleteMyBlog = async (id_nguoi_dung, id_bai_viet) => {
  const blog = await blogRepository.findByIdWithOwner(id_bai_viet, id_nguoi_dung);

  if (!blog) {
    throw new Error("Không tìm thấy bài viết của bạn");
  }

  if (blog.trang_thai === "da_dang") {
    return blogRepository.update(blog, { trang_thai: "an" });
  }

  await blogRepository.remove(blog);
  return true;
};

const toggleLike = async (id_nguoi_dung, id_bai_viet) => {
  const blog = await blogRepository.findById(id_bai_viet);

  if (!blog || blog.trang_thai !== "da_dang") {
    throw new Error("Không tìm thấy bài viết đã đăng");
  }

  const existed = await blogRepository.findLike(id_bai_viet, id_nguoi_dung);
};

const getAdminBlogs = async (query) => {
  const page = toNumber(query.page, 1);
  const limit = toNumber(query.limit, 10);
  const result = await blogRepository.findAdmin({
    trang_thai: query.trang_thai || "tat_ca",
    keyword: query.keyword || "",
    page,
    limit,
  });

  return {
    data: result.rows,
    pagination: buildPagination(result.count, page, limit),
  };
};

const changeStatusByAdmin = async (id_bai_viet, trang_thai) => {
  const blog = await blogRepository.findById(id_bai_viet);

  if (!blog) {
    throw new Error("Không tìm thấy bài viết");
  }

  return blogRepository.update(blog, {
    trang_thai,
    ngay_cap_nhat: new Date(),
  });
};

module.exports = {
  createBlog,
  getPublicBlogs,
  getBlogDetail,
  getMyBlogs,
  updateMyBlog,
  deleteMyBlog,
  toggleLike,
  getAdminBlogs,
  changeStatusByAdmin,
};
