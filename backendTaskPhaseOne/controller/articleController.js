const Article = require('../models/Article');

const getArticles = async (req, res) => {
  try {
    const { type, includeAll, page = 1, limit = 15 } = req.query;

    let query = {};

    if (type) {
      query.type = type;
    }

    if (!includeAll) {
      query.originalArticleId = null;
    }

    const skip = (page - 1) * limit;

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('originalArticleId', 'title url');

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      count: articles.length,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('originalArticleId', 'title url content');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    let updatedVersions = [];
    if (article.type === 'original') {
      updatedVersions = await Article.find({ originalArticleId: article._id });
    }

    res.json({
      success: true,
      data: {
        ...article.toObject(),
        updatedVersions: updatedVersions
      }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const createArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      url,
      author,
      publishedDate,
      imageUrl,
      type,
      originalArticleId,
      references
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content'
      });
    }

    if (type === 'updated' && !originalArticleId) {
      return res.status(400).json({
        success: false,
        message: 'originalArticleId is required for updated articles'
      });
    }

    const article = await Article.create({
      title,
      content,
      url,
      author,
      publishedDate,
      imageUrl,
      type,
      originalArticleId,
      references
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const updateArticle = async (req, res) => {
  try {
    let article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (article.type === 'original') {
      await Article.deleteMany({ originalArticleId: article._id });
    }

    await article.deleteOne();

    res.json({
      success: true,
      message: 'Article deleted successfully',
      data: {}
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
};
