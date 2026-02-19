Feature: Location Management in VendPORTAL

  Background:
    Given user is logged in

  @tc-030 @locations @high-priority @smoke @production
  Scenario: Navigate to Locations section and verify all page elements
    When user navigates to Locations page
    Then locations page should be loaded
    And locations container should be visible
    And all location metric cards should be visible
    And location table should be visible
    And location search input should be visible
    And add location button should be visible

  @tc-031 @locations @high-priority @critical @production
  Scenario: Add new location with required fields
    When user navigates to Locations page
    And user clicks Add location button
    Then add location modal should be visible
    When user fills location name "Test Location Automated"
    And user selects country "Poland"
    And user fills location city "Test City"
    And user fills location street "Test Street"
    And user fills location building number "123"
    And user fills location postal code "00-001"
    And user selects location priority "Medium"
    And user selects location status "Active"
    And user clicks location Save button
    Then location "Test City" should appear in table

  @location @critical @API
  Scenario: Delete location by name via API
    Given User is logged in via API
    When Delete location by name "Test Location Automated" using API
    Then Location "Test Location Automated" are deleted successfully via API