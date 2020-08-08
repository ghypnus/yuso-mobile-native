/**
 * rollup配置文件
 */
import babel from 'rollup-plugin-babel'
import { uglify } from "rollup-plugin-uglify"
import license from "rollup-plugin-license"

export default [{
  input: 'src/index.js',
  output: {
    file: 'lib/yuso-mobile-native.js',
    format: 'cjs'
  },
  plugins: [
    license({
      banner: getBanner(),
    }),
    babel(getBabel()),
  ],
  external: getExternal()
}, {
  input: 'src/index.js',
  output: {
    file: 'lib/yuso-mobile-native.min.js',
    format: 'cjs'
  },
  plugins: [
    license({
      banner: getBanner(),
    }),
    babel(getBabel()),
    uglify()
  ],
  external: getExternal()
}]

function getExternal() {
  return ['uuid']
}
/**
 * banner信息
 */
function getBanner() {
  return `<%= pkg.name %>
                    author : <%= pkg.author %>
                    homepage : <%= pkg.homepage %>`
}

/**
 * babel配置信息
 */
function getBabel() {
  return {
    include: 'src/**',
    exclude: 'node_modules/**'
  }
}