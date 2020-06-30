/**
 * @jest-environment node
 */
describe('Window Loads Properly', () => {
  it('a', async () => {
    // Window was created
    expect(await client.getWindowCount()).toBe(1)
    // It is not minimized
    expect(await win.isMinimized()).toBe(false)
    // Window is visible
    expect(await win.isVisible()).toBe(true)
    // Size is correct
    const { width, height } = await win.getBounds()
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })

  it('b', async () => {
    // Window was created
    expect(await client.getWindowCount()).toBe(1)
    // It is not minimized
    expect(await win.isMinimized()).toBe(false)
    // Window is visible
    expect(await win.isVisible()).toBe(true)
    // Size is correct
    const { width, height } = await win.getBounds()
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })
})
