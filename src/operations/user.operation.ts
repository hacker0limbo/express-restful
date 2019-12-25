import UserModel from '../models/user.model'
import PostModel from '../models/post.model'

/**
 * 根据 country 分类组合以后返回的 user 的信息
 */
export async function getUsersByCountries() {
  const usersByCountries = await UserModel.aggregate([
    {
      $match: {
        'address': {
          $exists: true
        }
      }
    }, {
      $group: {
        _id: {
          city: '$address.city',
        },
        users: {
          $push: {
            _id: '$_id',
            name: '$name',
          }
        },
        count: {
          $sum: 1
        }
      }
    }, {
      $lookup: {
        from: 'posts',
        localField: 'users._id',
        foreignField: 'author',
        as: 'articles'
      }
    }, {
      $addFields: {
        amountOfArticles: {
          $size: '$articles',
        }
      }
    }, {
      $sort: {
        amountOfArticles: 1
      }
    }
  ])

  return usersByCountries
}
