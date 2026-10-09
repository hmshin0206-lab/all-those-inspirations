---
title: "Marketing Research Note (1) Chi-squared, T-test"
date: "2017-11-24T16:35:44+09:00"
category: "study"
topics: ["Marketing"]
stage: "evergreen"
description: "I took the Marketing Research course this spring and here is what I have jotted down during the class. I am sharing this on this blog since I wanted to review it before I forget and also save it somew"
wpUrl: "https://heathershinblog.wordpress.com/2017/11/24/marketing-research-note-1-chi-squared-t-test/"
---

I took the Marketing Research course this spring and here is what I have jotted down during the class. I am sharing this on this blog since I wanted to review it before I forget and also save it somewhere safe (not only in my notebook that I am probably going to lose someday). Since it is an essence of the course material which includes what I have learned during the statistics course, I admit that this is not something that you can refer when you look for the material that is very kind and explains everything one by one. (For example, I did not explain what null hypothesis means or why we can only reject something with strong evidence but it does not mean we support it.) However, I hope this might be helpful who have learned statistics and marketing research before and who wants to remind the basics of the subject.

Please contact me (There is a ‘Contact’ button on this blog) if you have any questions or suggestions and I will answer as far as I know.

* * *

#### Levels of Measurement

-   Nominal: labeling variables without any quantitative value  i.e. 0: Yes / 1: No
-   Ordinal: order of the values  i.e. How important is this value?
-   Interval: Not only order but the exact difference  ex) temperature
-   Ratio: 0 has a meaning  i.e. How many movies do you watch per month? Weight or Height

#### Hypothesis Testing

Chi-squared Test

H0 (null hypothesis): There is no relationship between X and Y  
H1 (alternative hypothesis): There is a significant\* relationship between X and Y

*\* Significant in this context can be different depending on the confidence level. (Normally, we set the confidence level as 95%, which means the significance level is 0.05)*

In SPSS, we use ‘**Crosstabs**‘ function in order to calculate the frequency in the two dimensions. If P-value (meaning, the percentage of error you’re going to make if H0 is true) < 0.05 (significance level), we reject H0.

T-Test  
(This is used when we compare two variables. If we need to compare more than two, we use ANOVA)

H0: There is no difference in means of X and Y  
H1: There is a significant difference in means of X and Y

In SPSS, we use ‘**Independent T-Test**‘ function in order to compare two means.

**SPSS**

Here is a usage of analysis in SPSS depending on the levels of measurement. For example, we can only do Crosstab function (meaning Chi-squared test) in one nominal and one ordinal data. (i.e. X: gender, Y: Whether they watched movie or not) I will discuss the ‘Regression’ and ‘ANOVA’ in the next post.

Nominal/Ordinal

(Binary)

Nominal/Ordinal

(Multiple Category)

Interval/Ratio

Nominal/Ordinal

(Binary)

Crosstab,  Chi-square Test

Independent T-Test

Nominal/Ordinal

(Multiple Category)

ANOVA

Interval/Ratio

Independent T-Test

ANOVA

Regression

Marketing Research by Tao Chen

Johns Hopkins Carey Business School
