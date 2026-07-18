const { limitStaffAreaService } = require("../services");

const getAssignments = async (req, res) => {
  try {
    const assignments = await limitStaffAreaService.getAssignments(req.user);
    return res.status(200).json({
      success: true,
      message: "Lay danh sach phan vung nhan vien thanh cong",
      data: assignments,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const assignStaffToArea = async (req, res) => {
  try {
    const assignment = await limitStaffAreaService.assignStaffToArea(
      req.user,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Phan vung nhan vien tham dinh thanh cong",
      data: assignment,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const assignment = await limitStaffAreaService.updateAssignment(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Cap nhat phan vung nhan vien thanh cong",
      data: assignment,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAssignments,
  assignStaffToArea,
  updateAssignment,
};
