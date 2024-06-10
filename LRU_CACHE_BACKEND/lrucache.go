// // METHOD 3
package main

import (
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CacheItem represents an item stored in the cache
type CacheItem struct {
	Value      interface{}
	Expiration time.Time
}

// LRUCache represents the LRU cache
type LRUCache struct {
	cache    map[string]CacheItem
	capacity int
	eviction chan string
	mutex    sync.Mutex
}

// NewLRUCache creates a new LRU cache with the specified capacity
func NewLRUCache(capacity int) *LRUCache {
	return &LRUCache{
		cache:    make(map[string]CacheItem),
		capacity: capacity,
		eviction: make(chan string),
	}
}

// Get retrieves the value associated with the given key from the cache
func (c *LRUCache) Get(key string) (interface{}, bool) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	item, found := c.cache[key]
	if !found || item.Expiration.Before(time.Now()) {
		return nil, false
	}

	return item.Value, true
}

// Set adds a new key/value pair to the cache with a customizable expiration time
func (c *LRUCache) Set(key string, value interface{}, expiration time.Duration) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.cache[key] = CacheItem{
		Value:      value,
		Expiration: time.Now().Add(expiration),
	}

	// Start a goroutine to evict expired keys
	go func() {
		time.Sleep(expiration)
		c.eviction <- key
	}()
}

// Delete removes the key/value pair from the cache
func (c *LRUCache) Delete(key string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	delete(c.cache, key)
}

// EvictExpiredKeys removes expired keys from the cache
func (c *LRUCache) EvictExpiredKeys() {
	for {
		key := <-c.eviction
		delete(c.cache, key)
	}
}

// API Handlers
func getHandler(c *gin.Context) {
	key := c.Param("key")
	value, found := cache.Get(key)
	if !found {
		c.JSON(404, gin.H{"message": "Key not found", "status": 404})
		return
	}
	c.JSON(200, gin.H{"data": gin.H{"key": key, "value": value}, "status": 200, "message": "Key found in cache"})
}

func setHandler(c *gin.Context) {
	var data struct {
		Key        string      `json:"key"`
		Value      interface{} `json:"value"`
		Expiration int         `json:"expiration"`
	}
	if err := c.BindJSON(&data); err != nil {
		c.JSON(400, gin.H{"message": "Invalid request", "status": 400})
		return
	}
	cache.Set(data.Key, data.Value, time.Duration(data.Expiration)*time.Second)
	c.JSON(200, gin.H{"data": gin.H{"key": data.Key, "value": data.Value, "expiration": data.Expiration}, "message": "Key set in cache", "status": 200})
}

func deleteHandler(c *gin.Context) {
	key := c.Param("key")
	cache.Delete(key)
	c.JSON(200, gin.H{"message": "Key deleted", "status": 200})
}

var cache *LRUCache

func main() {
	cache = NewLRUCache(100)
	go cache.EvictExpiredKeys()

	router := gin.Default()
	router.Use(cors.Default())

	// API Endpoints
	router.GET("/api/cache", func(c *gin.Context) {
		format_cache := make([]gin.H, 0)
		for key, item := range cache.cache {
			format_cache = append(format_cache, gin.H{"key": key, "value": item.Value, "expiration": item.Expiration})
		}
		c.JSON(200, gin.H{"data": format_cache, "status": 200, "message": "Cache retrieved"})
	})
	router.GET("/api/cache/:key", getHandler)
	router.POST("/api/cache", setHandler)
	router.DELETE("/api/cache/:key", deleteHandler)

	router.Run(":8080")
}
