# nexus-shell Specification

## Purpose
TBD - created by archiving change suspend-choicefit-ui. Update Purpose after archive.
## Requirements
### Requirement: Active module navigation
主導覽列 SHALL 只顯示目前啟用的模組：LifeOS 與 Kite。
Choice-Fit 連結 SHALL NOT 出現在導覽列中。

#### Scenario: Nav renders without Choice-Fit
- **WHEN** 使用者開啟任意頁面
- **THEN** 導覽列只顯示 LifeOS 與 Kite 兩個連結，不含 Choice-Fit

### Requirement: Home page module cards
首頁 SHALL 只顯示目前啟用模組的卡片：LifeOS 與 Kite。
Choice-Fit 卡片 SHALL NOT 出現在首頁。

#### Scenario: Home renders without Choice-Fit card
- **WHEN** 使用者進入首頁 `/`
- **THEN** 只看到 LifeOS 與 Kite 兩張模組卡片，不含 Choice-Fit

