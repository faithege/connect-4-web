import { CloudFrontAllowedMethods, CloudFrontWebDistribution, OriginAccessIdentity } from "@aws-cdk/aws-cloudfront";
import { CanonicalUserPrincipal, PolicyStatement } from "@aws-cdk/aws-iam";
import { BlockPublicAccess, Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Construct, RemovalPolicy, Stack, StackProps } from "@aws-cdk/core";

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
 export class StaticSite extends Construct {
    constructor(parent: Stack, name: string, props?: StackProps) {
      super(parent, name);

      const domainName = "faithege.dev"
      const subDomainName = "c4-aws"
      const siteDomain  = `${subDomainName}.${domainName}`
  
      
      // 1. Make s3 bucket
      const siteBucket = new Bucket(this, 'SiteBucket', {
        bucketName: siteDomain,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: '404.html',
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

        /**
         * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
         * setting will enable full cleanup of the demo.
         */
        autoDeleteObjects: true, // NOT recommended for production code
      });


      // 2. Make cloudfront cdn

      /* 
      * create oai and grant access to s3 for cloudfront
      * oai is a virtual user identity that will be used to give your CF distribution 
      permission to fetch a private object from your origin server*/
      const cloudfrontOAI = new OriginAccessIdentity(this, 'cloudfront-OAI', {
        comment: `OAI for ${name}`
      });
      const s3AccessPolicy = new PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [siteBucket.arnForObjects('*')],
        principals: [new CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
      })
      siteBucket.addToResourcePolicy(s3AccessPolicy);

      const cloudfrontDistribution = new CloudFrontWebDistribution(this, 'SiteDistribution', {
        //viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
              originAccessIdentity: cloudfrontOAI
            },
            behaviors: [{
              isDefaultBehavior: true,
              //compress: true,
              //allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
            }],
          }
        ]
      });

      // 3. Populate s3 using s3 deployment
      new BucketDeployment (this, 'BucketDeployment', {
        sources: [Source.asset('../vue-frontend/dist')],
        destinationBucket: siteBucket,
        distribution: cloudfrontDistribution,
        distributionPaths: ['/*'],
      });

      //need to run script that will generate build files - do in separate action? where will files be? tell BucketDeploymen
      //need to add this resource into pipeline stack
    }
 }