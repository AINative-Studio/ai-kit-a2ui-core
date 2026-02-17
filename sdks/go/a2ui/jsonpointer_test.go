package a2ui_test

import (
	"testing"

	"github.com/ainative/a2ui-go/a2ui"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJSONPointerResolve(t *testing.T) {
	t.Run("resolve simple object property", func(t *testing.T) {
		data := map[string]interface{}{
			"user": map[string]interface{}{
				"name": "Alice",
				"age":  float64(30),
			},
		}

		jp := &a2ui.JSONPointer{}

		name, err := jp.Resolve(data, "/user/name")
		require.NoError(t, err)
		assert.Equal(t, "Alice", name)

		age, err := jp.Resolve(data, "/user/age")
		require.NoError(t, err)
		assert.Equal(t, float64(30), age)
	})

	t.Run("resolve nested object", func(t *testing.T) {
		data := map[string]interface{}{
			"user": map[string]interface{}{
				"profile": map[string]interface{}{
					"city": "NYC",
				},
			},
		}

		jp := &a2ui.JSONPointer{}

		city, err := jp.Resolve(data, "/user/profile/city")
		require.NoError(t, err)
		assert.Equal(t, "NYC", city)
	})

	t.Run("resolve array element", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		item, err := jp.Resolve(data, "/items/0")
		require.NoError(t, err)
		assert.Equal(t, "a", item)

		item, err = jp.Resolve(data, "/items/2")
		require.NoError(t, err)
		assert.Equal(t, "c", item)
	})

	t.Run("resolve root with empty pointer", func(t *testing.T) {
		data := map[string]interface{}{
			"value": 123,
		}

		jp := &a2ui.JSONPointer{}

		result, err := jp.Resolve(data, "")
		require.NoError(t, err)
		assert.Equal(t, data, result)
	})

	t.Run("resolve with escaped characters", func(t *testing.T) {
		data := map[string]interface{}{
			"user~name": "Alice",
			"path/to": map[string]interface{}{
				"value": 123,
			},
		}

		jp := &a2ui.JSONPointer{}

		// ~ is escaped as ~0
		name, err := jp.Resolve(data, "/user~0name")
		require.NoError(t, err)
		assert.Equal(t, "Alice", name)

		// / is escaped as ~1
		val, err := jp.Resolve(data, "/path~1to/value")
		require.NoError(t, err)
		assert.Equal(t, 123, val)
	})

	t.Run("return error for non-existent path", func(t *testing.T) {
		data := map[string]interface{}{
			"user": map[string]interface{}{
				"name": "Alice",
			},
		}

		jp := &a2ui.JSONPointer{}

		_, err := jp.Resolve(data, "/user/missing")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})

	t.Run("return error for invalid pointer format", func(t *testing.T) {
		data := map[string]interface{}{}

		jp := &a2ui.JSONPointer{}

		_, err := jp.Resolve(data, "invalid")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "must start with")
	})

	t.Run("return error for invalid array index", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		_, err := jp.Resolve(data, "/items/invalid")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid array index")
	})

	t.Run("return error for out of bounds array index", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		_, err := jp.Resolve(data, "/items/10")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "out of bounds")
	})
}

func TestJSONPointerSet(t *testing.T) {
	t.Run("set existing property", func(t *testing.T) {
		data := map[string]interface{}{
			"user": map[string]interface{}{
				"name": "Alice",
			},
		}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "/user/age", float64(30))
		require.NoError(t, err)

		user := data["user"].(map[string]interface{})
		assert.Equal(t, float64(30), user["age"])
	})

	t.Run("create intermediate objects", func(t *testing.T) {
		data := map[string]interface{}{}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "/user/profile/city", "NYC")
		require.NoError(t, err)

		user := data["user"].(map[string]interface{})
		profile := user["profile"].(map[string]interface{})
		assert.Equal(t, "NYC", profile["city"])
	})

	t.Run("set array element", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "/items/1", "B")
		require.NoError(t, err)

		items := data["items"].([]interface{})
		assert.Equal(t, "B", items[1])
	})

	t.Run("append to array with - token", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "/items/-", "d")
		require.NoError(t, err)

		items := data["items"].([]interface{})
		assert.Equal(t, 4, len(items))
		assert.Equal(t, "d", items[3])
	})

	t.Run("return error for invalid pointer", func(t *testing.T) {
		data := map[string]interface{}{}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "invalid", "value")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "must start with")
	})

	t.Run("return error for setting root", func(t *testing.T) {
		data := map[string]interface{}{}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "", "value")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot set root")
	})

	t.Run("return error for invalid array index", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		err := jp.Set(data, "/items/invalid", "value")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid array index")
	})
}

func TestJSONPointerRemove(t *testing.T) {
	t.Run("remove object property", func(t *testing.T) {
		data := map[string]interface{}{
			"user": map[string]interface{}{
				"name": "Alice",
				"age":  float64(30),
			},
		}

		jp := &a2ui.JSONPointer{}

		removed, err := jp.Remove(data, "/user/age")
		require.NoError(t, err)
		assert.True(t, removed)

		user := data["user"].(map[string]interface{})
		_, exists := user["age"]
		assert.False(t, exists)
	})

	t.Run("remove array element", func(t *testing.T) {
		data := map[string]interface{}{
			"items": []interface{}{"a", "b", "c"},
		}

		jp := &a2ui.JSONPointer{}

		removed, err := jp.Remove(data, "/items/1")
		require.NoError(t, err)
		assert.True(t, removed)

		items := data["items"].([]interface{})
		assert.Equal(t, 2, len(items))
		assert.Equal(t, "a", items[0])
		assert.Equal(t, "c", items[1])
	})

	t.Run("return false for non-existent path", func(t *testing.T) {
		data := map[string]interface{}{
			"user": map[string]interface{}{
				"name": "Alice",
			},
		}

		jp := &a2ui.JSONPointer{}

		removed, err := jp.Remove(data, "/user/missing")
		require.NoError(t, err)
		assert.False(t, removed)
	})

	t.Run("return error for invalid pointer", func(t *testing.T) {
		data := map[string]interface{}{}

		jp := &a2ui.JSONPointer{}

		_, err := jp.Remove(data, "invalid")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "must start with")
	})

	t.Run("return error for removing root", func(t *testing.T) {
		data := map[string]interface{}{}

		jp := &a2ui.JSONPointer{}

		_, err := jp.Remove(data, "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot remove root")
	})
}

func TestJSONPointerParse(t *testing.T) {
	t.Run("parse simple pointer", func(t *testing.T) {
		jp := &a2ui.JSONPointer{}

		tokens := jp.Parse("/user/profile/name")
		assert.Equal(t, []string{"user", "profile", "name"}, tokens)
	})

	t.Run("parse empty pointer", func(t *testing.T) {
		jp := &a2ui.JSONPointer{}

		tokens := jp.Parse("")
		assert.Equal(t, []string{}, tokens)
	})

	t.Run("parse pointer with escaped characters", func(t *testing.T) {
		jp := &a2ui.JSONPointer{}

		// ~0 -> ~, ~1 -> /
		tokens := jp.Parse("/user~0name/path~1to")
		assert.Equal(t, []string{"user~name", "path/to"}, tokens)
	})

	t.Run("return error for invalid pointer", func(t *testing.T) {
		jp := &a2ui.JSONPointer{}

		tokens := jp.Parse("invalid")
		assert.Nil(t, tokens)
	})
}

func TestJSONPointerComplexScenarios(t *testing.T) {
	t.Run("complex nested data structure", func(t *testing.T) {
		data := map[string]interface{}{
			"organization": map[string]interface{}{
				"name": "ACME Corp",
				"departments": []interface{}{
					map[string]interface{}{
						"name": "Engineering",
						"employees": []interface{}{
							map[string]interface{}{
								"name":     "Alice",
								"position": "Senior Engineer",
							},
							map[string]interface{}{
								"name":     "Bob",
								"position": "Junior Engineer",
							},
						},
					},
				},
			},
		}

		jp := &a2ui.JSONPointer{}

		// Navigate deep nested structure
		name, err := jp.Resolve(data, "/organization/departments/0/employees/0/name")
		require.NoError(t, err)
		assert.Equal(t, "Alice", name)

		// Update nested value
		err = jp.Set(data, "/organization/departments/0/employees/1/position", "Senior Engineer")
		require.NoError(t, err)

		position, err := jp.Resolve(data, "/organization/departments/0/employees/1/position")
		require.NoError(t, err)
		assert.Equal(t, "Senior Engineer", position)
	})

	t.Run("RFC 6901 example data", func(t *testing.T) {
		// Example from RFC 6901
		data := map[string]interface{}{
			"foo":  []interface{}{"bar", "baz"},
			"":     float64(0),
			"a/b":  float64(1),
			"c%d":  float64(2),
			"e^f":  float64(3),
			"g|h":  float64(4),
			"i\\j": float64(5),
			"k\"l": float64(6),
			" ":    float64(7),
			"m~n":  float64(8),
		}

		jp := &a2ui.JSONPointer{}

		// Test various RFC 6901 examples
		val, err := jp.Resolve(data, "")
		require.NoError(t, err)
		assert.Equal(t, data, val)

		val, err = jp.Resolve(data, "/foo")
		require.NoError(t, err)
		assert.Equal(t, []interface{}{"bar", "baz"}, val)

		val, err = jp.Resolve(data, "/foo/0")
		require.NoError(t, err)
		assert.Equal(t, "bar", val)

		val, err = jp.Resolve(data, "/")
		require.NoError(t, err)
		assert.Equal(t, float64(0), val)

		val, err = jp.Resolve(data, "/a~1b")
		require.NoError(t, err)
		assert.Equal(t, float64(1), val)

		val, err = jp.Resolve(data, "/m~0n")
		require.NoError(t, err)
		assert.Equal(t, float64(8), val)
	})
}
