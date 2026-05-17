# 网易云音乐 API 功能汇总与使用方法

本文档是对网易云音乐所有功能的API及其使用方法的统一汇总。基于 Node.js 调用方式。

## 如何使用

通过 Node.js 模块方式调用：
```javascript
const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');

async function main() {
    try {
        // 调用对应的方法
        const result = await NeteaseCloudMusicApi.song_url_v1({ id: '33894312', level: 'exhigh' });
        console.log(result.body);
    } catch (error) {
        console.log(error);
    }
}
main();
```

也可以作为HTTP请求调用：如果启动了 `app.js` 服务，请求路径通常是将方法名中的 `_` 替换为 `/`，例如 `login_cellphone` 对应请求 `/login/cellphone`。

---

## 接口汇总

| 序号 | 接口方法名 (HTTP路线) | 功能描述 |
| --- | --- | --- |
| 1 | `activate_init_profile` (`/activate/init/profile`) | 初始化名字 |
| 2 | `aidj_content_rcmd` (`/aidj/content/rcmd`) | 私人 DJ |
| 3 | `album` (`/album`) | 专辑内容 |
| 4 | `album_detail` (`/album/detail`) | 数字专辑详情 |
| 5 | `album_detail_dynamic` (`/album/detail/dynamic`) | 专辑动态信息 |
| 6 | `album_list` (`/album/list`) | 数字专辑-新碟上架 |
| 7 | `album_list_style` (`/album/list/style`) | 数字专辑-语种风格馆 |
| 8 | `album_new` (`/album/new`) | 全部新碟 |
| 9 | `album_newest` (`/album/newest`) | 最新专辑 |
| 10 | `album_privilege` (`/album/privilege`) | 获取专辑歌曲的音质 |
| 11 | `album_songsaleboard` (`/album/songsaleboard`) | 数字专辑&数字单曲-榜单 |
| 12 | `album_sub` (`/album/sub`) | 收藏/取消收藏专辑 |
| 13 | `album_sublist` (`/album/sublist`) | 已收藏专辑列表 |
| 14 | `api` (`/api`) | 无描述 |
| 15 | `artist_album` (`/artist/album`) | 歌手专辑列表 |
| 16 | `artist_desc` (`/artist/desc`) | 歌手介绍 |
| 17 | `artist_detail` (`/artist/detail`) | 无描述 |
| 18 | `artist_detail_dynamic` (`/artist/detail/dynamic`) | 歌手动态信息 |
| 19 | `artist_fans` (`/artist/fans`) | 歌手粉丝 |
| 20 | `artist_follow_count` (`/artist/follow/count`) | 歌手粉丝数量 |
| 21 | `artist_list` (`/artist/list`) | 歌手分类 |
| 22 | `artist_mv` (`/artist/mv`) | 歌手相关MV |
| 23 | `artist_new_mv` (`/artist/new/mv`) | 无描述 |
| 24 | `artist_new_song` (`/artist/new/song`) | 无描述 |
| 25 | `artist_songs` (`/artist/songs`) | 无描述 |
| 26 | `artist_sub` (`/artist/sub`) | 收藏与取消收藏歌手 |
| 27 | `artist_sublist` (`/artist/sublist`) | 关注歌手列表 |
| 28 | `artist_top_song` (`/artist/top/song`) | 歌手热门 50 首歌曲 |
| 29 | `artist_video` (`/artist/video`) | 歌手相关视频 |
| 30 | `artists` (`/artists`) | 歌手单曲 |
| 31 | `audio_match` (`/audio/match`) | 无描述 |
| 32 | `avatar_upload` (`/avatar/upload`) | 无描述 |
| 33 | `banner` (`/banner`) | 首页轮播图 |
| 34 | `batch` (`/batch`) | 批量请求接口 |
| 35 | `broadcast_category_region_get` (`/broadcast/category/region/get`) | 广播电台 - 分类/地区信息 |
| 36 | `broadcast_channel_collect_list` (`/broadcast/channel/collect/list`) | 广播电台 - 我的收藏 |
| 37 | `broadcast_channel_currentinfo` (`/broadcast/channel/currentinfo`) | 广播电台 - 电台信息 |
| 38 | `broadcast_channel_list` (`/broadcast/channel/list`) | 广播电台 - 全部电台 |
| 39 | `broadcast_sub` (`/broadcast/sub`) | 广播电台 - 收藏/取消收藏电台 |
| 40 | `calendar` (`/calendar`) | 无描述 |
| 41 | `captcha_sent` (`/captcha/sent`) | 发送验证码 |
| 42 | `captcha_verify` (`/captcha/verify`) | 校验验证码 |
| 43 | `cellphone_existence_check` (`/cellphone/existence/check`) | 检测手机号码是否已注册 |
| 44 | `check_music` (`/check/music`) | 歌曲可用性 |
| 45 | `cloud` (`/cloud`) | 无描述 |
| 46 | `cloud_import` (`/cloud/import`) | 云盘导入歌曲 |
| 47 | `cloud_match` (`/cloud/match`) | 无描述 |
| 48 | `cloudsearch` (`/cloudsearch`) | 搜索 |
| 49 | `comment` (`/comment`) | 无描述 |
| 50 | `comment_album` (`/comment/album`) | 专辑评论 |
| 51 | `comment_dj` (`/comment/dj`) | 电台评论 |
| 52 | `comment_event` (`/comment/event`) | 获取动态评论 |
| 53 | `comment_floor` (`/comment/floor`) | 无描述 |
| 54 | `comment_hot` (`/comment/hot`) | 无描述 |
| 55 | `comment_hug_list` (`/comment/hug/list`) | 无描述 |
| 56 | `comment_like` (`/comment/like`) | 无描述 |
| 57 | `comment_music` (`/comment/music`) | 歌曲评论 |
| 58 | `comment_mv` (`/comment/mv`) | MV评论 |
| 59 | `comment_new` (`/comment/new`) | 无描述 |
| 60 | `comment_playlist` (`/comment/playlist`) | 歌单评论 |
| 61 | `comment_video` (`/comment/video`) | 视频评论 |
| 62 | `countries_code_list` (`/countries/code/list`) | 国家编码列表 |
| 63 | `creator_authinfo_get` (`/creator/authinfo/get`) | 获取达人用户信息 |
| 64 | `daily_signin` (`/daily/signin`) | 签到 |
| 65 | `digitalAlbum_detail` (`/digitalAlbum/detail`) | 数字专辑详情 |
| 66 | `digitalAlbum_ordering` (`/digitalAlbum/ordering`) | 购买数字专辑 |
| 67 | `digitalAlbum_purchased` (`/digitalAlbum/purchased`) | 我的数字专辑 |
| 68 | `digitalAlbum_sales` (`/digitalAlbum/sales`) | 数字专辑销量 |
| 69 | `djRadio_top` (`/djRadio/top`) | 电台排行榜获取 |
| 70 | `dj_banner` (`/dj/banner`) | 电台banner |
| 71 | `dj_category_excludehot` (`/dj/category/excludehot`) | 电台非热门类型 |
| 72 | `dj_category_recommend` (`/dj/category/recommend`) | 电台推荐类型 |
| 73 | `dj_catelist` (`/dj/catelist`) | 电台分类列表 |
| 74 | `dj_detail` (`/dj/detail`) | 电台详情 |
| 75 | `dj_hot` (`/dj/hot`) | 热门电台 |
| 76 | `dj_paygift` (`/dj/paygift`) | 付费电台 |
| 77 | `dj_personalize_recommend` (`/dj/personalize/recommend`) | 电台个性推荐 |
| 78 | `dj_program` (`/dj/program`) | 电台节目列表 |
| 79 | `dj_program_detail` (`/dj/program/detail`) | 电台节目详情 |
| 80 | `dj_program_toplist` (`/dj/program/toplist`) | 电台节目榜 |
| 81 | `dj_program_toplist_hours` (`/dj/program/toplist/hours`) | 电台24小时节目榜 |
| 82 | `dj_radio_hot` (`/dj/radio/hot`) | 类别热门电台 |
| 83 | `dj_recommend` (`/dj/recommend`) | 精选电台 |
| 84 | `dj_recommend_type` (`/dj/recommend/type`) | 精选电台分类 |
| 85 | `dj_sub` (`/dj/sub`) | 订阅与取消电台 |
| 86 | `dj_sublist` (`/dj/sublist`) | 订阅电台列表 |
| 87 | `dj_subscriber` (`/dj/subscriber`) | 电台详情 |
| 88 | `dj_today_perfered` (`/dj/today/perfered`) | 电台今日优选 |
| 89 | `dj_toplist` (`/dj/toplist`) | 新晋电台榜/热门电台榜 |
| 90 | `dj_toplist_hours` (`/dj/toplist/hours`) | 电台24小时主播榜 |
| 91 | `dj_toplist_newcomer` (`/dj/toplist/newcomer`) | 电台新人榜 |
| 92 | `dj_toplist_pay` (`/dj/toplist/pay`) | 付费精品 |
| 93 | `dj_toplist_popular` (`/dj/toplist/popular`) | 电台最热主播榜 |
| 94 | `eapi_decrypt` (`/eapi/decrypt`) | 无描述 |
| 95 | `event` (`/event`) | 获取动态列表 |
| 96 | `event_del` (`/event/del`) | 删除动态 |
| 97 | `event_forward` (`/event/forward`) | 无描述 |
| 98 | `fanscenter_basicinfo_age_get` (`/fanscenter/basicinfo/age/get`) | 粉丝年龄比例 |
| 99 | `fanscenter_basicinfo_gender_get` (`/fanscenter/basicinfo/gender/get`) | 粉丝性别比例 |
| 100 | `fanscenter_basicinfo_province_get` (`/fanscenter/basicinfo/province/get`) | 粉丝省份比例 |
| 101 | `fanscenter_overview_get` (`/fanscenter/overview/get`) | 粉丝数量 |
| 102 | `fanscenter_trend_list` (`/fanscenter/trend/list`) | 粉丝来源 |
| 103 | `fm_trash` (`/fm/trash`) | 垃圾桶 |
| 104 | `follow` (`/follow`) | 关注与取消关注用户 |
| 105 | `get_userids` (`/get/userids`) | 无描述 |
| 106 | `history_recommend_songs` (`/history/recommend/songs`) | 历史每日推荐歌曲 |
| 107 | `history_recommend_songs_detail` (`/history/recommend/songs/detail`) | 历史每日推荐歌曲详情 |
| 108 | `homepage_block_page` (`/homepage/block/page`) | 首页-发现 block page |
| 109 | `homepage_dragon_ball` (`/homepage/dragon/ball`) | 首页-发现 dragon ball |
| 110 | `hot_topic` (`/hot/topic`) | 热门话题 |
| 111 | `hug_comment` (`/hug/comment`) | 无描述 |
| 112 | `inner_version` (`/inner/version`) | 无描述 |
| 113 | `like` (`/like`) | 红心与取消红心歌曲 |
| 114 | `likelist` (`/likelist`) | 喜欢的歌曲(无序) |
| 115 | `listen_data_realtime_report` (`/listen/data/realtime/report`) | 听歌足迹 - 本周/本月收听时长 |
| 116 | `listen_data_report` (`/listen/data/report`) | 听歌足迹 - 周/月/年收听报告 |
| 117 | `listen_data_today_song` (`/listen/data/today/song`) | 听歌足迹 - 今日收听 |
| 118 | `listen_data_total` (`/listen/data/total`) | 听歌足迹 - 总收听时长 |
| 119 | `listen_data_year_report` (`/listen/data/year/report`) | 听歌足迹 - 年度听歌足迹 |
| 120 | `listentogether_accept` (`/listentogether/accept`) | 无描述 |
| 121 | `listentogether_end` (`/listentogether/end`) | 一起听 结束房间 |
| 122 | `listentogether_heatbeat` (`/listentogether/heatbeat`) | 一起听 发送心跳 |
| 123 | `listentogether_play_command` (`/listentogether/play/command`) | 一起听 发送播放状态 |
| 124 | `listentogether_room_check` (`/listentogether/room/check`) | 一起听 房间情况 |
| 125 | `listentogether_room_create` (`/listentogether/room/create`) | 一起听创建房间 |
| 126 | `listentogether_status` (`/listentogether/status`) | 一起听状态 |
| 127 | `listentogether_sync_list_command` (`/listentogether/sync/list/command`) | 一起听 更新播放列表 |
| 128 | `listentogether_sync_playlist_get` (`/listentogether/sync/playlist/get`) | 一起听 当前列表获取 |
| 129 | `login` (`/login`) | 邮箱登录 |
| 130 | `login_cellphone` (`/login/cellphone`) | 手机登录 |
| 131 | `login_qr_check` (`/login/qr/check`) | 无描述 |
| 132 | `login_qr_create` (`/login/qr/create`) | 无描述 |
| 133 | `login_qr_key` (`/login/qr/key`) | 无描述 |
| 134 | `login_refresh` (`/login/refresh`) | 登录刷新 |
| 135 | `login_status` (`/login/status`) | 无描述 |
| 136 | `logout` (`/logout`) | 退出登录 |
| 137 | `lyric` (`/lyric`) | 歌词 |
| 138 | `lyric_new` (`/lyric/new`) | 新版歌词 - 包含逐字歌词 |
| 139 | `mlog_music_rcmd` (`/mlog/music/rcmd`) | 歌曲相关视频 |
| 140 | `mlog_to_video` (`/mlog/to/video`) | 将mlog id转为video id |
| 141 | `mlog_url` (`/mlog/url`) | mlog链接 |
| 142 | `msg_comments` (`/msg/comments`) | 评论 |
| 143 | `msg_forwards` (`/msg/forwards`) | @我 |
| 144 | `msg_notices` (`/msg/notices`) | 通知 |
| 145 | `msg_private` (`/msg/private`) | 私信 |
| 146 | `msg_private_history` (`/msg/private/history`) | 私信内容 |
| 147 | `msg_recentcontact` (`/msg/recentcontact`) | 最近联系 |
| 148 | `music_first_listen_info` (`/music/first/listen/info`) | 回忆坐标 |
| 149 | `musician_cloudbean` (`/musician/cloudbean`) | 账号云豆数 |
| 150 | `musician_cloudbean_obtain` (`/musician/cloudbean/obtain`) | 领取云豆 |
| 151 | `musician_data_overview` (`/musician/data/overview`) | 音乐人数据概况 |
| 152 | `musician_play_trend` (`/musician/play/trend`) | 音乐人歌曲播放趋势 |
| 153 | `musician_sign` (`/musician/sign`) | 音乐人签到 |
| 154 | `musician_tasks` (`/musician/tasks`) | 获取音乐人任务 |
| 155 | `musician_tasks_new` (`/musician/tasks/new`) | 获取音乐人任务 |
| 156 | `mv_all` (`/mv/all`) | 全部MV |
| 157 | `mv_detail` (`/mv/detail`) | MV详情 |
| 158 | `mv_detail_info` (`/mv/detail/info`) | MV 点赞转发评论数数据 |
| 159 | `mv_exclusive_rcmd` (`/mv/exclusive/rcmd`) | 网易出品 |
| 160 | `mv_first` (`/mv/first`) | 最新MV |
| 161 | `mv_sub` (`/mv/sub`) | 收藏与取消收藏MV |
| 162 | `mv_sublist` (`/mv/sublist`) | 已收藏MV列表 |
| 163 | `mv_url` (`/mv/url`) | MV链接 |
| 164 | `nickname_check` (`/nickname/check`) | 无描述 |
| 165 | `personal_fm` (`/personal/fm`) | 私人FM |
| 166 | `personal_fm_mode` (`/personal/fm/mode`) | 私人FM - 模式选择 |
| 167 | `personalized` (`/personalized`) | 推荐歌单 |
| 168 | `personalized_djprogram` (`/personalized/djprogram`) | 推荐电台 |
| 169 | `personalized_mv` (`/personalized/mv`) | 推荐MV |
| 170 | `personalized_newsong` (`/personalized/newsong`) | 推荐新歌 |
| 171 | `personalized_privatecontent` (`/personalized/privatecontent`) | 独家放送 |
| 172 | `personalized_privatecontent_list` (`/personalized/privatecontent/list`) | 独家放送列表 |
| 173 | `pl_count` (`/pl/count`) | 私信和通知接口 |
| 174 | `playlist_category_list` (`/playlist/category/list`) | 歌单分类列表 |
| 175 | `playlist_catlist` (`/playlist/catlist`) | 全部歌单分类 |
| 176 | `playlist_cover_update` (`/playlist/cover/update`) | 无描述 |
| 177 | `playlist_create` (`/playlist/create`) | 创建歌单 |
| 178 | `playlist_delete` (`/playlist/delete`) | 删除歌单 |
| 179 | `playlist_desc_update` (`/playlist/desc/update`) | 更新歌单描述 |
| 180 | `playlist_detail` (`/playlist/detail`) | 歌单详情 |
| 181 | `playlist_detail_dynamic` (`/playlist/detail/dynamic`) | 歌单动态信息 |
| 182 | `playlist_detail_rcmd_get` (`/playlist/detail/rcmd/get`) | 相关歌单推荐 |
| 183 | `playlist_highquality_tags` (`/playlist/highquality/tags`) | 精品歌单 tags |
| 184 | `playlist_hot` (`/playlist/hot`) | 热门歌单分类 |
| 185 | `playlist_import_name_task_create` (`/playlist/import/name/task/create`) | 歌单导入 - 元数据/文字/链接导入 |
| 186 | `playlist_import_task_status` (`/playlist/import/task/status`) | 歌单导入 - 任务状态 |
| 187 | `playlist_mylike` (`/playlist/mylike`) | 无描述 |
| 188 | `playlist_name_update` (`/playlist/name/update`) | 更新歌单名 |
| 189 | `playlist_order_update` (`/playlist/order/update`) | 编辑歌单顺序 |
| 190 | `playlist_privacy` (`/playlist/privacy`) | 公开隐私歌单 |
| 191 | `playlist_subscribe` (`/playlist/subscribe`) | 收藏与取消收藏歌单 |
| 192 | `playlist_subscribers` (`/playlist/subscribers`) | 歌单收藏者 |
| 193 | `playlist_tags_update` (`/playlist/tags/update`) | 更新歌单标签 |
| 194 | `playlist_track_add` (`/playlist/track/add`) | 无描述 |
| 195 | `playlist_track_all` (`/playlist/track/all`) | 通过传过来的歌单id拿到所有歌曲数据 |
| 196 | `playlist_track_delete` (`/playlist/track/delete`) | 收藏单曲到歌单 从歌单删除歌曲 |
| 197 | `playlist_tracks` (`/playlist/tracks`) | 收藏单曲到歌单 从歌单删除歌曲 |
| 198 | `playlist_update` (`/playlist/update`) | 编辑歌单 |
| 199 | `playlist_update_playcount` (`/playlist/update/playcount`) | 歌单打卡 |
| 200 | `playlist_video_recent` (`/playlist/video/recent`) | 无描述 |
| 201 | `playmode_intelligence_list` (`/playmode/intelligence/list`) | 智能播放 |
| 202 | `playmode_song_vector` (`/playmode/song/vector`) | 云随机播放 |
| 203 | `program_recommend` (`/program/recommend`) | 推荐节目 |
| 204 | `rebind` (`/rebind`) | 更换手机 |
| 205 | `recent_listen_list` (`/recent/listen/list`) | 最近听歌列表 |
| 206 | `recommend_resource` (`/recommend/resource`) | 每日推荐歌单 |
| 207 | `recommend_songs` (`/recommend/songs`) | 每日推荐歌曲 |
| 208 | `recommend_songs_dislike` (`/recommend/songs/dislike`) | 每日推荐歌曲-不感兴趣 |
| 209 | `record_recent_album` (`/record/recent/album`) | 无描述 |
| 210 | `record_recent_dj` (`/record/recent/dj`) | 无描述 |
| 211 | `record_recent_playlist` (`/record/recent/playlist`) | 无描述 |
| 212 | `record_recent_song` (`/record/recent/song`) | 无描述 |
| 213 | `record_recent_video` (`/record/recent/video`) | 无描述 |
| 214 | `record_recent_voice` (`/record/recent/voice`) | 无描述 |
| 215 | `register_anonimous` (`/register/anonimous`) | 无描述 |
| 216 | `register_cellphone` (`/register/cellphone`) | 注册账号 |
| 217 | `related_allvideo` (`/related/allvideo`) | 相关视频 |
| 218 | `related_playlist` (`/related/playlist`) | 相关歌单 |
| 219 | `resource_like` (`/resource/like`) | 点赞与取消点赞资源 |
| 220 | `scrobble` (`/scrobble`) | 听歌打卡 |
| 221 | `search` (`/search`) | 搜索 |
| 222 | `search_default` (`/search/default`) | 默认搜索关键词 |
| 223 | `search_hot` (`/search/hot`) | 热门搜索 |
| 224 | `search_hot_detail` (`/search/hot/detail`) | 热搜列表 |
| 225 | `search_match` (`/search/match`) | 本地歌曲匹配音乐信息 |
| 226 | `search_multimatch` (`/search/multimatch`) | 多类型搜索 |
| 227 | `search_suggest` (`/search/suggest`) | 搜索建议 |
| 228 | `send_album` (`/send/album`) | 私信专辑 |
| 229 | `send_playlist` (`/send/playlist`) | 私信歌单 |
| 230 | `send_song` (`/send/song`) | 私信歌曲 |
| 231 | `send_text` (`/send/text`) | 私信 |
| 232 | `setting` (`/setting`) | 设置 |
| 233 | `share_resource` (`/share/resource`) | 分享歌曲到动态 |
| 234 | `sheet_list` (`/sheet/list`) | 乐谱列表 |
| 235 | `sheet_preview` (`/sheet/preview`) | 乐谱预览 |
| 236 | `sign_happy_info` (`/sign/happy/info`) | 无描述 |
| 237 | `signin_progress` (`/signin/progress`) | 签到进度 |
| 238 | `simi_artist` (`/simi/artist`) | 相似歌手 |
| 239 | `simi_mv` (`/simi/mv`) | 相似MV |
| 240 | `simi_playlist` (`/simi/playlist`) | 相似歌单 |
| 241 | `simi_song` (`/simi/song`) | 相似歌曲 |
| 242 | `simi_user` (`/simi/user`) | 相似用户 |
| 243 | `song_chorus` (`/song/chorus`) | 副歌时间 |
| 244 | `song_detail` (`/song/detail`) | 歌曲详情 |
| 245 | `song_downlist` (`/song/downlist`) | 会员下载歌曲记录 |
| 246 | `song_download_url` (`/song/download/url`) | 获取客户端歌曲下载链接 |
| 247 | `song_download_url_v1` (`/song/download/url/v1`) | 获取客户端歌曲下载链接 - v1 |
| 248 | `song_dynamic_cover` (`/song/dynamic/cover`) | 歌曲动态封面 |
| 249 | `song_like_check` (`/song/like/check`) | 歌曲是否喜爱 |
| 250 | `song_lyrics_mark` (`/song/lyrics/mark`) | 歌词摘录 - 歌词摘录信息 |
| 251 | `song_lyrics_mark_add` (`/song/lyrics/mark/add`) | 歌词摘录 - 添加/修改摘录歌词 |
| 252 | `song_lyrics_mark_del` (`/song/lyrics/mark/del`) | 歌词摘录 - 删除摘录歌词 |
| 253 | `song_lyrics_mark_user_page` (`/song/lyrics/mark/user/page`) | 歌词摘录 - 我的歌词本 |
| 254 | `song_monthdownlist` (`/song/monthdownlist`) | 会员本月下载歌曲记录 |
| 255 | `song_music_detail` (`/song/music/detail`) | 歌曲音质详情 |
| 256 | `song_order_update` (`/song/order/update`) | 更新歌曲顺序 |
| 257 | `song_purchased` (`/song/purchased`) | 已购单曲 |
| 258 | `song_red_count` (`/song/red/count`) | 歌曲红心数量 |
| 259 | `song_singledownlist` (`/song/singledownlist`) | 已购买单曲 |
| 260 | `song_url` (`/song/url`) | 歌曲链接 |
| 261 | `song_url_v1` (`/song/url/v1`) | 歌曲链接 - v1 |
| 262 | `song_wiki_summary` (`/song/wiki/summary`) | 音乐百科基础信息 |
| 263 | `starpick_comments_summary` (`/starpick/comments/summary`) | 云村星评馆 - 简要评论列表 |
| 264 | `style_album` (`/style/album`) | 曲风-专辑 |
| 265 | `style_artist` (`/style/artist`) | 曲风-歌手 |
| 266 | `style_detail` (`/style/detail`) | 曲风详情 |
| 267 | `style_list` (`/style/list`) | 曲风列表 |
| 268 | `style_playlist` (`/style/playlist`) | 曲风-歌单 |
| 269 | `style_preference` (`/style/preference`) | 曲风偏好 |
| 270 | `style_song` (`/style/song`) | 曲风-歌曲 |
| 271 | `summary_annual` (`/summary/annual`) | 年度听歌报告2017-2023 |
| 272 | `threshold_detail_get` (`/threshold/detail/get`) | 获取达人达标信息 |
| 273 | `top_album` (`/top/album`) | 新碟上架 |
| 274 | `top_artists` (`/top/artists`) | 热门歌手 |
| 275 | `top_list` (`/top/list`) | 排行榜 |
| 276 | `top_mv` (`/top/mv`) | MV排行榜 |
| 277 | `top_playlist` (`/top/playlist`) | 分类歌单 |
| 278 | `top_playlist_highquality` (`/top/playlist/highquality`) | 精品歌单 |
| 279 | `top_song` (`/top/song`) | 新歌速递 |
| 280 | `topic_detail` (`/topic/detail`) | 无描述 |
| 281 | `topic_detail_event_hot` (`/topic/detail/event/hot`) | 无描述 |
| 282 | `topic_sublist` (`/topic/sublist`) | 收藏的专栏 |
| 283 | `toplist` (`/toplist`) | 所有榜单介绍 |
| 284 | `toplist_artist` (`/toplist/artist`) | 歌手榜 |
| 285 | `toplist_detail` (`/toplist/detail`) | 所有榜单内容摘要 |
| 286 | `toplist_detail_v2` (`/toplist/detail/v2`) | 所有榜单内容摘要v2 |
| 287 | `ugc_album_get` (`/ugc/album/get`) | 专辑简要百科信息 |
| 288 | `ugc_artist_get` (`/ugc/artist/get`) | 歌手简要百科信息 |
| 289 | `ugc_artist_search` (`/ugc/artist/search`) | 搜索歌手 |
| 290 | `ugc_detail` (`/ugc/detail`) | 用户贡献内容 |
| 291 | `ugc_mv_get` (`/ugc/mv/get`) | mv简要百科信息 |
| 292 | `ugc_song_get` (`/ugc/song/get`) | 歌曲简要百科信息 |
| 293 | `ugc_user_devote` (`/ugc/user/devote`) | 用户贡献条目、积分、云贝数量 |
| 294 | `user_account` (`/user/account`) | 无描述 |
| 295 | `user_audio` (`/user/audio`) | 用户创建的电台 |
| 296 | `user_binding` (`/user/binding`) | 无描述 |
| 297 | `user_bindingcellphone` (`/user/bindingcellphone`) | 无描述 |
| 298 | `user_cloud` (`/user/cloud`) | 云盘数据 |
| 299 | `user_cloud_del` (`/user/cloud/del`) | 云盘歌曲删除 |
| 300 | `user_cloud_detail` (`/user/cloud/detail`) | 云盘数据详情 |
| 301 | `user_comment_history` (`/user/comment/history`) | 无描述 |
| 302 | `user_detail` (`/user/detail`) | 用户详情 |
| 303 | `user_detail_new` (`/user/detail/new`) | 用户详情 |
| 304 | `user_dj` (`/user/dj`) | 用户电台节目 |
| 305 | `user_event` (`/user/event`) | 用户动态 |
| 306 | `user_follow_mixed` (`/user/follow/mixed`) | 当前账号关注的用户/歌手 |
| 307 | `user_followeds` (`/user/followeds`) | 关注TA的人(粉丝) |
| 308 | `user_follows` (`/user/follows`) | TA关注的人(关注) |
| 309 | `user_level` (`/user/level`) | 类别热门电台 |
| 310 | `user_medal` (`/user/medal`) | 用户徽章 |
| 311 | `user_mutualfollow_get` (`/user/mutualfollow/get`) | 用户是否互相关注 |
| 312 | `user_playlist` (`/user/playlist`) | 用户歌单 |
| 313 | `user_record` (`/user/record`) | 听歌排行 |
| 314 | `user_replacephone` (`/user/replacephone`) | 无描述 |
| 315 | `user_social_status` (`/user/social/status`) | 用户状态 |
| 316 | `user_social_status_edit` (`/user/social/status/edit`) | 用户状态 - 编辑 |
| 317 | `user_social_status_rcmd` (`/user/social/status/rcmd`) | 用户状态 - 相同状态的用户 |
| 318 | `user_social_status_support` (`/user/social/status/support`) | 用户状态 - 支持设置的状态 |
| 319 | `user_subcount` (`/user/subcount`) | 收藏计数 |
| 320 | `user_update` (`/user/update`) | 编辑用户信息 |
| 321 | `verify_getQr` (`/verify/getQr`) | 无描述 |
| 322 | `verify_qrcodestatus` (`/verify/qrcodestatus`) | 无描述 |
| 323 | `video_category_list` (`/video/category/list`) | 视频分类列表 |
| 324 | `video_detail` (`/video/detail`) | 视频详情 |
| 325 | `video_detail_info` (`/video/detail/info`) | 视频点赞转发评论数数据 |
| 326 | `video_group` (`/video/group`) | 视频标签/分类下的视频 |
| 327 | `video_group_list` (`/video/group/list`) | 视频标签列表 |
| 328 | `video_sub` (`/video/sub`) | 收藏与取消收藏视频 |
| 329 | `video_timeline_all` (`/video/timeline/all`) | 全部视频列表 |
| 330 | `video_timeline_recommend` (`/video/timeline/recommend`) | 推荐视频 |
| 331 | `video_url` (`/video/url`) | 视频链接 |
| 332 | `vip_growthpoint` (`/vip/growthpoint`) | 会员成长值 |
| 333 | `vip_growthpoint_details` (`/vip/growthpoint/details`) | 会员成长值领取记录 |
| 334 | `vip_growthpoint_get` (`/vip/growthpoint/get`) | 领取会员成长值 |
| 335 | `vip_info` (`/vip/info`) | 获取 VIP 信息 |
| 336 | `vip_info_v2` (`/vip/info/v2`) | 获取 VIP 信息 |
| 337 | `vip_tasks` (`/vip/tasks`) | 会员任务 |
| 338 | `vip_timemachine` (`/vip/timemachine`) | 黑胶时光机 |
| 339 | `voice_delete` (`/voice/delete`) | 无描述 |
| 340 | `voice_detail` (`/voice/detail`) | 无描述 |
| 341 | `voice_lyric` (`/voice/lyric`) | 无描述 |
| 342 | `voice_upload` (`/voice/upload`) | 无描述 |
| 343 | `voicelist_detail` (`/voicelist/detail`) | 无描述 |
| 344 | `voicelist_list` (`/voicelist/list`) | 无描述 |
| 345 | `voicelist_list_search` (`/voicelist/list/search`) | 声音搜索 |
| 346 | `voicelist_search` (`/voicelist/search`) | 无描述 |
| 347 | `voicelist_trans` (`/voicelist/trans`) | 无描述 |
| 348 | `weblog` (`/weblog`) | 操作记录 |
| 349 | `yunbei` (`/yunbei`) | 无描述 |
| 350 | `yunbei_expense` (`/yunbei/expense`) | 无描述 |
| 351 | `yunbei_info` (`/yunbei/info`) | 无描述 |
| 352 | `yunbei_rcmd_song` (`/yunbei/rcmd/song`) | 云贝推歌 |
| 353 | `yunbei_rcmd_song_history` (`/yunbei/rcmd/song/history`) | 云贝推歌历史记录 |
| 354 | `yunbei_receipt` (`/yunbei/receipt`) | 无描述 |
| 355 | `yunbei_sign` (`/yunbei/sign`) | 无描述 |
| 356 | `yunbei_task_finish` (`/yunbei/task/finish`) | 无描述 |
| 357 | `yunbei_tasks` (`/yunbei/tasks`) | 无描述 |
| 358 | `yunbei_tasks_todo` (`/yunbei/tasks/todo`) | 无描述 |
| 359 | `yunbei_today` (`/yunbei/today`) | 无描述 |
