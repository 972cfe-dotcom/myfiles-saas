import { supabase, TABLES } from '../lib/supabase.js'

export class CategoryService {
  // Get all categories for current user
  static async getUserCategories() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  // Create new category
  static async createCategory(name, description = '', color = '#4f46e5') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .insert({
          name,
          description,
          color,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  // Update category
  static async updateCategory(categoryId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .update(updates)
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  // Delete category
  static async deleteCategory(categoryId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First, update any documents using this category to null
      await supabase
        .from(TABLES.DOCUMENTS)
        .update({ category_id: null })
        .eq('category_id', categoryId)
        .eq('user_id', user.id)

      // Then delete the category
      const { error } = await supabase
        .from(TABLES.CATEGORIES)
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  // Get category with document count
  static async getCategoryStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get categories with document counts
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .select(`
          *,
          documents:documents(count)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Also get uncategorized count
      const { count: uncategorizedCount } = await supabase
        .from(TABLES.DOCUMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('category_id', null)

      return {
        categories: data || [],
        uncategorizedCount: uncategorizedCount || 0
      }
    } catch (error) {
      console.error('Error fetching category stats:', error)
      throw error
    }
  }
}

export class TagService {
  // Get all tags for current user
  static async getUserTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TAGS)
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  }

  // Create new tag
  static async createTag(name, color = '#6b7280') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TAGS)
        .insert({
          name,
          color,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  // Update tag
  static async updateTag(tagId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TAGS)
        .update(updates)
        .eq('id', tagId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating tag:', error)
      throw error
    }
  }

  // Delete tag
  static async deleteTag(tagId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Delete tag (this will cascade delete document_tags relationships)
      const { error } = await supabase
        .from(TABLES.TAGS)
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  }

  // Get popular tags (most used)
  static async getPopularTags(limit = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TAGS)
        .select('*')
        .eq('user_id', user.id)
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching popular tags:', error)
      throw error
    }
  }

  // Search tags by name
  static async searchTags(query) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TAGS)
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching tags:', error)
      throw error
    }
  }
}